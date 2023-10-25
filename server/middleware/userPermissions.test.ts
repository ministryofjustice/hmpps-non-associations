import type { Request, Response, NextFunction } from 'express'

import {
  userRolePrison,
  userRoleGlobalSearch,
  userRoleInactiveBookings,
  userRoleManageNonAssociations,
  transferPrisonId,
  outsidePrisonId,
} from '../data/constants'
import type { OffenderSearchResult } from '../data/offenderSearch'
import {
  davidJones,
  fredMills,
  andrewBrown,
  maxClarke,
  joePeters,
  nathanLost,
  mockMovePrisoner,
} from '../data/testData/offenderSearch'
import {
  mockUser,
  mockNonPrisonUser,
  mockReadOnlyUser,
  mockUserWithoutGlobalSearch,
  mockUserWithGlobalSearch,
  mockUserWithInactiveBookings,
  mockCaseloads,
} from '../routes/testutils/appSetup'
import userPermissions, { type UserPermissions } from './userPermissions'

function expectUser(user: Express.User) {
  const req = jest.fn() as unknown as jest.Mocked<Request>
  const res = jest.fn() as unknown as jest.Mocked<Response>
  res.locals = {
    breadcrumbs: undefined,
    messages: {},
    user,
  } satisfies Express.Locals
  const next = jest.fn() as unknown as jest.Mocked<NextFunction>

  userPermissions()(req, res, next)

  expect(next).toHaveBeenCalled()

  const { permissions } = res.locals.user

  return {
    get permissions(): UserPermissions {
      return permissions
    },

    toHavePermissionFlags(
      flags: Pick<Express.User['permissions'], 'read' | 'write' | 'globalSearch' | 'inactiveBookings'>,
    ): void {
      expect(permissions).toEqual(expect.objectContaining(flags))
    },

    canViewPrisonerProfile(prisoner: OffenderSearchResult): void {
      expect(permissions.canViewProfile(prisoner)).toEqual(true)
    },

    cannotViewPrisonerProfile(prisoner: OffenderSearchResult): void {
      expect(permissions.canViewProfile(prisoner)).toEqual(false)
    },

    toHaveWritePermission(prisoner: OffenderSearchResult, otherPrisoner: OffenderSearchResult): void {
      expect(permissions.canWriteNonAssociation(prisoner, otherPrisoner)).toEqual(true)
    },

    notToHaveWritePermission(prisoner: OffenderSearchResult, otherPrisoner: OffenderSearchResult): void {
      expect(permissions.canWriteNonAssociation(prisoner, otherPrisoner)).toEqual(false)
    },
  }
}

type ViewProfileScenarios = ReadonlyArray<{
  scenario: string
  user: Express.User
  prisoner: OffenderSearchResult
}>

type HasWritePermissionScenarios = ReadonlyArray<{
  scenario: string
  user: Express.User
  prisoner: OffenderSearchResult
  otherPrisoner: OffenderSearchResult
}>

describe('userPermissions', () => {
  it('should set no read/write flags if the user is missing roles', () => {
    expectUser(mockNonPrisonUser).toHavePermissionFlags({
      read: false,
      write: false,
      globalSearch: false,
      inactiveBookings: false,
    })
  })

  it('should set read flag if user has necessary role', () => {
    expectUser(mockReadOnlyUser).toHavePermissionFlags({
      read: true,
      write: false,
      globalSearch: false,
      inactiveBookings: false,
    })
  })

  it('should set read & write flags if user has necessary roles', () => {
    expectUser(mockUserWithoutGlobalSearch).toHavePermissionFlags({
      read: true,
      write: true,
      globalSearch: false,
      inactiveBookings: false,
    })
  })

  it('should set write flag only for prison users', () => {
    expectUser({
      ...mockUser,
      roles: [userRoleManageNonAssociations],
    }).toHavePermissionFlags({
      read: false,
      write: false,
      globalSearch: false,
      inactiveBookings: false,
    })
  })

  describe('should set global search flag for users with necessary role', () => {
    it('if they have read permission', () => {
      expectUser({
        ...mockUser,
        roles: [userRolePrison, userRoleGlobalSearch],
      }).toHavePermissionFlags({
        read: true,
        write: false,
        globalSearch: true,
        inactiveBookings: false,
      })
    })

    it('if they also have write permission', () => {
      expectUser(mockUserWithGlobalSearch).toHavePermissionFlags({
        read: true,
        write: true,
        globalSearch: true,
        inactiveBookings: false,
      })
    })

    it('but not if they don’t have read permission', () => {
      expectUser({
        ...mockUser,
        roles: [userRoleGlobalSearch],
      }).toHavePermissionFlags({
        read: false,
        write: false,
        globalSearch: false,
        inactiveBookings: false,
      })
    })
  })

  describe('should set inactive bookings flag for users with necessary role', () => {
    it('if they have read permission', () => {
      expectUser({
        ...mockUser,
        roles: [userRolePrison, userRoleInactiveBookings],
      }).toHavePermissionFlags({
        read: true,
        write: false,
        globalSearch: false,
        inactiveBookings: true,
      })
    })

    it('if they also have write permission', () => {
      expectUser({
        ...mockUser,
        roles: [userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations],
      }).toHavePermissionFlags({
        read: true,
        write: true,
        globalSearch: false,
        inactiveBookings: true,
      })
    })

    it('but not if they don’t have read permission', () => {
      expectUser({
        ...mockUser,
        roles: [userRoleInactiveBookings],
      }).toHavePermissionFlags({
        read: false,
        write: false,
        globalSearch: false,
        inactiveBookings: false,
      })
    })
  })

  it('should set all flags for users with all necessary permissions', () => {
    expectUser({
      ...mockUser,
      roles: [userRolePrison, userRoleGlobalSearch, userRoleInactiveBookings, userRoleManageNonAssociations],
    }).toHavePermissionFlags({
      read: true,
      write: true,
      globalSearch: true,
      inactiveBookings: true,
    })
  })

  describe('should allow viewing a profile', () => {
    it.each([
      {
        scenario: 'in your active caseload',
        user: mockUser,
        prisoner: davidJones,
      },
      {
        scenario: 'in another of your caseloads',
        user: {
          ...mockUser,
          caseloads: [...mockCaseloads, { id: 'LEI', name: 'Leeds (HMP)' }],
        },
        prisoner: andrewBrown,
      },
      {
        scenario: 'of prisoners being transferred if you have global search',
        user: mockUser,
        prisoner: maxClarke,
      },
      {
        scenario: 'of people not in an establishment if you have inactive bookings role',
        user: mockUser,
        prisoner: joePeters,
      },
    ] satisfies ViewProfileScenarios)('$scenario', ({ user, prisoner }) => {
      expectUser(user).canViewPrisonerProfile(prisoner)
    })
  })

  describe('should not allow viewing a profile', () => {
    it.each([
      {
        scenario: 'not in your caseloads',
        user: mockUser,
        prisoner: andrewBrown,
      },
      {
        scenario: 'of prisoners being transferred if you do not have global search',
        user: {
          ...mockUser,
          roles: [userRolePrison, userRoleManageNonAssociations, userRoleInactiveBookings],
        },
        prisoner: maxClarke,
      },
      {
        scenario: 'of people not in an establishment if you do not have inactive bookings role',
        user: {
          ...mockUser,
          roles: [userRolePrison, userRoleManageNonAssociations, userRoleGlobalSearch],
        },
        prisoner: joePeters,
      },
      {
        scenario: 'of people with unknown locations',
        user: mockUser,
        prisoner: nathanLost,
      },
    ] satisfies ViewProfileScenarios)('$scenario', ({ user, prisoner }) => {
      expectUser(user).cannotViewPrisonerProfile(prisoner)
    })
  })

  describe('should allow modifying a non-association between', () => {
    it.each([
      {
        scenario: 'prisoners in your active caseload',
        user: mockUser,
        prisoner: davidJones,
        otherPrisoner: fredMills,
      },
      {
        scenario: 'prisoners in any of your caseloads',
        user: {
          ...mockUser,
          caseloads: [...mockCaseloads, { id: 'LEI', name: 'Leeds (HMP)' }],
        },
        prisoner: davidJones,
        otherPrisoner: andrewBrown,
      },
      {
        scenario: 'a prisoner in your caseloads and another being transferred if you have global search',
        user: mockUser,
        prisoner: davidJones,
        otherPrisoner: maxClarke,
      },
      {
        scenario: 'a prisoner being transferred and another in your caseloads if you have global search',
        user: mockUser,
        prisoner: maxClarke,
        otherPrisoner: davidJones,
      },
      {
        scenario: 'prisoners being transferred if you have global search',
        user: mockUser,
        prisoner: maxClarke,
        otherPrisoner: mockMovePrisoner(fredMills, transferPrisonId),
      },
      {
        scenario:
          'a prisoner in your caseloads and a person not in an establishment if you have inactive bookings role',
        user: mockUser,
        prisoner: fredMills,
        otherPrisoner: joePeters,
      },
      {
        scenario: 'a person not in an establishment and another in your caseloads if you have inactive bookings role',
        user: mockUser,
        prisoner: joePeters,
        otherPrisoner: fredMills,
      },
      {
        scenario: 'people not in establishments if you have inactive bookings role',
        user: mockUser,
        prisoner: joePeters,
        otherPrisoner: mockMovePrisoner(fredMills, outsidePrisonId),
      },
      {
        scenario: 'people being transferred and those not in establishments if you have necessary roles',
        user: mockUser,
        prisoner: maxClarke,
        otherPrisoner: joePeters,
      },
      {
        scenario:
          'one permitted prisoner and themselves (used to check whether a non-association can potentially be added)',
        user: mockUser,
        prisoner: davidJones,
        otherPrisoner: davidJones,
      },
    ] satisfies HasWritePermissionScenarios)('$scenario', ({ user, prisoner, otherPrisoner }) => {
      expectUser(user).toHaveWritePermission(prisoner, otherPrisoner)
    })
  })

  describe('should not allow modifying a non-association when', () => {
    it.each([
      {
        scenario: 'key prisoner is not in your caseloads if you don’t have global search',
        user: mockUserWithoutGlobalSearch,
        prisoner: andrewBrown,
        otherPrisoner: davidJones,
      },
      {
        scenario: 'other prisoner is not in your caseloads if you don’t have global search',
        user: mockUserWithoutGlobalSearch,
        prisoner: davidJones,
        otherPrisoner: andrewBrown,
      },
      {
        scenario: 'key prisoner is being transferred and you do not have global search',
        user: {
          ...mockUser,
          roles: [userRolePrison, userRoleManageNonAssociations, userRoleInactiveBookings],
        },
        prisoner: maxClarke,
        otherPrisoner: davidJones,
      },
      {
        scenario: 'other prisoner is being transferred and you do not have global search',
        user: {
          ...mockUser,
          roles: [userRolePrison, userRoleManageNonAssociations, userRoleInactiveBookings],
        },
        prisoner: davidJones,
        otherPrisoner: maxClarke,
      },
      {
        scenario: 'key person is not in an establishment and you do not have inactive bookings role',
        user: {
          ...mockUser,
          roles: [userRolePrison, userRoleManageNonAssociations, userRoleGlobalSearch],
        },
        prisoner: joePeters,
        otherPrisoner: davidJones,
      },
      {
        scenario: 'other person is not in an establishment and you do not have inactive bookings role',
        user: {
          ...mockUser,
          roles: [userRolePrison, userRoleManageNonAssociations, userRoleGlobalSearch],
        },
        prisoner: davidJones,
        otherPrisoner: joePeters,
      },
      {
        scenario:
          'both sides are one prisoner who is not permitted (used to check whether a non-association can potentially be added)',
        user: mockUser,
        prisoner: andrewBrown,
        otherPrisoner: andrewBrown,
      },
      {
        scenario: 'of people with unknown locations (possibly without even a booking)',
        user: mockUser,
        prisoner: nathanLost,
        otherPrisoner: davidJones,
      },
    ] satisfies HasWritePermissionScenarios)('$scenario', ({ user, prisoner, otherPrisoner }) => {
      expectUser(user).notToHaveWritePermission(prisoner, otherPrisoner)
    })
  })

  describe('should check roles and caseloads', () => {
    const labels = [
      'in caseloads',
      'not in caseloads',
      'being transferred',
      'not in an establishment',
      'with unknown location', // possibly doesn't even have a booking
    ]
    const prisoners = [fredMills, andrewBrown, maxClarke, joePeters, nathanLost]

    type ExpectationRow<T> = readonly [T, T, T, T, T]
    type ChallengeWith1Prisoner = (userPermissions: UserPermissions, prisoner: OffenderSearchResult) => boolean

    function expectForPrisoners(
      user: Express.User,
      challenge: ChallengeWith1Prisoner,
      expected: ExpectationRow<'Y' | 'N'>,
    ) {
      const { permissions } = expectUser(user)

      prisoners.forEach((prisoner, rowIndex) => {
        const prisonerLabel = labels[rowIndex]
        const expectedResult = expected[rowIndex] === 'Y'

        it(`challenge for a prionser ${prisonerLabel} should be ${expectedResult}`, () => {
          const result = challenge(permissions, prisoner)
          expect(result).toEqual(expectedResult)
        })
      })
    }

    describe('and forbid non-prison users from viewing prisoner profiles', () => {
      expectForPrisoners(
        mockNonPrisonUser,
        (permissions, prisoner) => {
          return permissions.canViewProfile(prisoner)
        },
        ['N', 'N', 'N', 'N', 'N'],
      )
    })

    describe('and allow prison users to view profiles in their caseloads', () => {
      expectForPrisoners(
        mockReadOnlyUser,
        (permissions, prisoner) => {
          return permissions.canViewProfile(prisoner)
        },
        ['Y', 'N', 'N', 'N', 'N'],
      )
    })

    describe('and allow prison users with global search to view profiles in their caseloads or in transfer', () => {
      expectForPrisoners(
        mockUserWithGlobalSearch,
        (permissions, prisoner) => {
          return permissions.canViewProfile(prisoner)
        },
        ['Y', 'N', 'Y', 'N', 'N'],
      )
    })

    describe('and allow prison users with inactive bookings to view profiles in their caseloads or outside', () => {
      expectForPrisoners(
        mockUserWithInactiveBookings,
        (permissions, prisoner) => {
          return permissions.canViewProfile(prisoner)
        },
        ['Y', 'N', 'N', 'Y', 'N'],
      )
    })

    describe('and allow prison users with global search and inactive bookings to view profiles in their caseloads, in transfer or outside', () => {
      expectForPrisoners(
        mockUser,
        (permissions, prisoner) => {
          return permissions.canViewProfile(prisoner)
        },
        ['Y', 'N', 'Y', 'Y', 'N'],
      )
    })

    type ExpectationGrid<T> = readonly [
      ExpectationRow<T>,
      ExpectationRow<T>,
      ExpectationRow<T>,
      ExpectationRow<T>,
      ExpectationRow<T>,
    ]
    type ChallengeWith2Prisoners = (
      userPermissions: UserPermissions,
      prisoner: OffenderSearchResult,
      otherPrisoner: OffenderSearchResult,
    ) => boolean

    function expectAllCombinationsWith2Prisoners(
      user: Express.User,
      challenge: ChallengeWith2Prisoners,
      // non-associations are symmetrical: ' ' means use inverse combination’s expected result
      expected: ExpectationGrid<'Y' | 'N' | ' '>,
    ): void {
      const { permissions } = expectUser(user)

      prisoners.forEach((prisoner, rowIndex) => {
        const prisonerLabel = labels[rowIndex]

        prisoners.forEach((otherPrisoner, columnIndex) => {
          const otherPrisonerLabel = labels[columnIndex]

          let expectation = expected[rowIndex][columnIndex]
          if (expectation === ' ') {
            expectation = expected[columnIndex][rowIndex]
          }
          const expectedResult = expectation === 'Y'

          it(`challenge for a non-association between a prionser ${prisonerLabel} and a prisoner ${otherPrisonerLabel} should be ${expectedResult}`, () => {
            const result = challenge(permissions, prisoner, otherPrisoner)
            expect(result).toEqual(expectedResult)
          })
        })
      })
    }

    describe('and forbid non-prison users from viewing or modifying any non-associations', () => {
      expectAllCombinationsWith2Prisoners(
        mockNonPrisonUser,
        (permissions, prisoner, otherPrisoner) => {
          return permissions.read || permissions.canWriteNonAssociation(prisoner, otherPrisoner)
        },
        [
          ['N', 'N', 'N', 'N', 'N'],
          [' ', 'N', 'N', 'N', 'N'],
          [' ', ' ', 'N', 'N', 'N'],
          [' ', ' ', ' ', 'N', 'N'],
          [' ', ' ', ' ', ' ', 'N'],
        ],
      )
    })

    describe('and allow prison users to view non-associations', () => {
      for (const user of [
        mockReadOnlyUser,
        mockUserWithoutGlobalSearch,
        mockUserWithGlobalSearch,
        mockUserWithInactiveBookings,
        mockUser,
      ]) {
        expectAllCombinationsWith2Prisoners(user, permissions => permissions.read, [
          ['Y', 'Y', 'Y', 'Y', 'Y'],
          [' ', 'Y', 'Y', 'Y', 'Y'],
          [' ', ' ', 'Y', 'Y', 'Y'],
          [' ', ' ', ' ', 'Y', 'Y'],
          [' ', ' ', ' ', ' ', 'Y'],
        ])
      }
    })

    describe('and allow prison users to only modify non-associations in their caseloads', () => {
      expectAllCombinationsWith2Prisoners(
        mockUserWithoutGlobalSearch,
        (permissions, prisoner, otherPrisoner) => {
          return permissions.read && permissions.canWriteNonAssociation(prisoner, otherPrisoner)
        },
        [
          ['Y', 'N', 'N', 'N', 'N'],
          [' ', 'N', 'N', 'N', 'N'],
          [' ', ' ', 'N', 'N', 'N'],
          [' ', ' ', ' ', 'N', 'N'],
          [' ', ' ', ' ', ' ', 'N'],
        ],
      )
    })

    describe('and allow prison users with global search to modify non-associations in transfer or when at least one is in their caseloads', () => {
      expectAllCombinationsWith2Prisoners(
        mockUserWithGlobalSearch,
        (permissions, prisoner, otherPrisoner) => {
          return permissions.read && permissions.canWriteNonAssociation(prisoner, otherPrisoner)
        },
        [
          ['Y', 'Y', 'Y', 'N', 'N'],
          [' ', 'N', 'N', 'N', 'N'],
          [' ', ' ', 'Y', 'N', 'N'],
          [' ', ' ', ' ', 'N', 'N'],
          [' ', ' ', ' ', ' ', 'N'],
        ],
      )
    })

    describe('and allow prison users with inactive bookings to modify non-associations in their caseloads or outside', () => {
      expectAllCombinationsWith2Prisoners(
        mockUserWithInactiveBookings,
        (permissions, prisoner, otherPrisoner) => {
          return permissions.read && permissions.canWriteNonAssociation(prisoner, otherPrisoner)
        },
        [
          ['Y', 'N', 'N', 'Y', 'N'],
          [' ', 'N', 'N', 'N', 'N'],
          [' ', ' ', 'N', 'N', 'N'],
          [' ', ' ', ' ', 'Y', 'N'],
          [' ', ' ', ' ', ' ', 'N'],
        ],
      )
    })

    describe('and allow prison users with global search and inactive bookings to modify non-associations in transfer, outside or when at least one is in their caseloads', () => {
      expectAllCombinationsWith2Prisoners(
        mockUser,
        (permissions, prisoner, otherPrisoner) => {
          return permissions.read && permissions.canWriteNonAssociation(prisoner, otherPrisoner)
        },
        [
          ['Y', 'Y', 'Y', 'Y', 'N'],
          [' ', 'N', 'N', 'N', 'N'],
          [' ', ' ', 'Y', 'Y', 'N'],
          [' ', ' ', ' ', 'Y', 'N'],
          [' ', ' ', ' ', ' ', 'N'],
        ],
      )
    })
  })
})
