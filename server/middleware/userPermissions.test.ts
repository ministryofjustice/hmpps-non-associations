import type { Request, Response, NextFunction } from 'express'

import {
  userRolePrison,
  userRoleGlobalSearch,
  userRoleInactiveBookings,
  userRoleManageNonAssociations,
} from '../data/constants'
import type { OffenderSearchResult } from '../data/offenderSearch'
import { fredMills, andrewBrown, maxClarke, joePeters, nathanLost } from '../data/testData/offenderSearch'
import {
  mockUser,
  mockNonPrisonUser,
  mockReadOnlyUser,
  mockUserWithoutGlobalSearch,
  mockUserWithGlobalSearch,
  mockUserWithInactiveBookings,
} from '../routes/testutils/appSetup'
import userPermissions, { UserPermissions } from './userPermissions'

type ExpectationRow<T> = readonly [T, T, T, T, T]
type ExpectationGrid<T> = readonly [
  ExpectationRow<T>,
  ExpectationRow<T>,
  ExpectationRow<T>,
  ExpectationRow<T>,
  ExpectationRow<T>,
]

class ExpectUser {
  private readonly permissions: UserPermissions

  constructor(private user: Express.User) {
    this.permissions = this.loadPermissionsViaMiddleware()
  }

  private loadPermissionsViaMiddleware(): UserPermissions {
    const req = jest.fn() as unknown as jest.Mocked<Request>
    const res = jest.fn() as unknown as jest.Mocked<Response>
    res.locals = {
      breadcrumbs: undefined,
      messages: {},
      user: this.user,
    } satisfies Express.Locals
    const next = jest.fn() as unknown as jest.Mocked<NextFunction>

    userPermissions()(req, res, next)

    expect(next).toHaveBeenCalled()
    const { permissions } = res.locals.user
    expect(permissions).toBeInstanceOf(UserPermissions)

    return permissions
  }

  toHavePermissionFlags(
    flags: Pick<Express.User['permissions'], 'read' | 'write' | 'prisonUser' | 'globalSearch' | 'inactiveBookings'>,
  ): void {
    expect(this.permissions).toEqual(expect.objectContaining(flags))
  }

  private forEachPrisonerLocation(
    callback: (prisoner: OffenderSearchResult, prisonerLabel: string, index: number) => void,
  ) {
    const prisoners = [fredMills, andrewBrown, maxClarke, joePeters, nathanLost]
    const prisonerLabels = [
      'in caseloads',
      'not in caseloads',
      'being transferred',
      'not in an establishment',
      'with unknown location', // possibly doesn't even have a booking
    ]
    prisoners.forEach((prisoner, index) => {
      const prisonerLabel = prisonerLabels[index]
      callback(prisoner, prisonerLabel, index)
    })
  }

  private challengeWith1Prisoner(
    challenge: (prisoner: OffenderSearchResult) => boolean,
    expected: ExpectationRow<'Y' | 'N'>,
  ) {
    this.forEachPrisonerLocation((prisoner, prisonerLabel, rowIndex) => {
      const expectedResult = expected[rowIndex] === 'Y'

      it(`challenge for a prionser ${prisonerLabel} should be ${expectedResult}`, () => {
        const result = challenge(prisoner)
        expect(result).toEqual(expectedResult)
      })
    })
  }

  canViewSomePrisonerProfiles(expected: ExpectationRow<'Y' | 'N'>) {
    this.challengeWith1Prisoner((prisoner: OffenderSearchResult) => {
      return this.permissions.canViewProfile(prisoner)
    }, expected)
  }

  private challengeWith2Prisoners(
    challenge: (prisoner: OffenderSearchResult, otherPrisoner: OffenderSearchResult) => boolean,
    // non-associations are symmetrical: ' ' means use inverse combination’s expected result
    expected: ExpectationGrid<'Y' | 'N' | ' '>,
  ) {
    this.forEachPrisonerLocation((prisoner, prisonerLabel, rowIndex) => {
      this.forEachPrisonerLocation((otherPrisoner, otherPrisonerLabel, columnIndex) => {
        let expectation = expected[rowIndex][columnIndex]
        if (expectation === ' ') {
          expectation = expected[columnIndex][rowIndex]
        }
        const expectedResult = expectation === 'Y'

        it(`challenge for a non-association between a prionser ${prisonerLabel} and a prisoner ${otherPrisonerLabel} should be ${expectedResult}`, () => {
          const result = challenge(prisoner, otherPrisoner)
          expect(result).toEqual(expectedResult)
        })
      })
    })
  }

  cannotViewAnyNonAssociations() {
    this.challengeWith2Prisoners(
      () => this.permissions.read,
      [
        ['N', 'N', 'N', 'N', 'N'],
        [' ', 'N', 'N', 'N', 'N'],
        [' ', ' ', 'N', 'N', 'N'],
        [' ', ' ', ' ', 'N', 'N'],
        [' ', ' ', ' ', ' ', 'N'],
      ],
    )
  }

  canViewSomeNonAssociations(expected: ExpectationGrid<'Y' | 'N' | ' '>) {
    this.challengeWith2Prisoners(() => this.permissions.read, expected)
  }

  canModifySomeNonAssociations(expected: ExpectationGrid<'Y' | 'N' | ' '>) {
    this.challengeWith2Prisoners((prisoner, otherPrisoner) => {
      return this.permissions.read && this.permissions.canWriteNonAssociation(prisoner, otherPrisoner)
    }, expected)
  }
}

describe('userPermissions', () => {
  it('should set no read/write flags if the user is missing roles', () => {
    new ExpectUser(mockNonPrisonUser).toHavePermissionFlags({
      read: false,
      write: false,
      prisonUser: false,
      globalSearch: false,
      inactiveBookings: false,
    })
  })

  it('should set read flag if user has necessary role', () => {
    new ExpectUser(mockReadOnlyUser).toHavePermissionFlags({
      read: true,
      write: false,
      prisonUser: true,
      globalSearch: false,
      inactiveBookings: false,
    })
  })

  it('should set read & write flags if user has necessary roles', () => {
    new ExpectUser(mockUserWithoutGlobalSearch).toHavePermissionFlags({
      read: true,
      write: true,
      prisonUser: true,
      globalSearch: false,
      inactiveBookings: false,
    })
  })

  it('should set write flag only for prison users', () => {
    new ExpectUser({
      ...mockUser,
      roles: [userRoleManageNonAssociations],
    }).toHavePermissionFlags({
      read: false,
      write: false,
      prisonUser: false,
      globalSearch: false,
      inactiveBookings: false,
    })
  })

  describe('should set global search flag for users with necessary role', () => {
    it('if they have read permission', () => {
      new ExpectUser({
        ...mockUser,
        roles: [userRolePrison, userRoleGlobalSearch],
      }).toHavePermissionFlags({
        read: true,
        write: false,
        prisonUser: true,
        globalSearch: true,
        inactiveBookings: false,
      })
    })

    it('if they also have write permission', () => {
      new ExpectUser(mockUserWithGlobalSearch).toHavePermissionFlags({
        read: true,
        write: true,
        prisonUser: true,
        globalSearch: true,
        inactiveBookings: false,
      })
    })

    it('but not if they don’t have read permission', () => {
      new ExpectUser({
        ...mockUser,
        roles: [userRoleGlobalSearch],
      }).toHavePermissionFlags({
        read: false,
        write: false,
        prisonUser: false,
        globalSearch: false,
        inactiveBookings: false,
      })
    })
  })

  describe('should set inactive bookings flag for users with necessary role', () => {
    it('if they have read permission', () => {
      new ExpectUser({
        ...mockUser,
        roles: [userRolePrison, userRoleInactiveBookings],
      }).toHavePermissionFlags({
        read: true,
        write: false,
        prisonUser: true,
        globalSearch: false,
        inactiveBookings: true,
      })
    })

    it('if they also have write permission', () => {
      new ExpectUser({
        ...mockUser,
        roles: [userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations],
      }).toHavePermissionFlags({
        read: true,
        write: true,
        prisonUser: true,
        globalSearch: false,
        inactiveBookings: true,
      })
    })

    it('but not if they don’t have read permission', () => {
      new ExpectUser({
        ...mockUser,
        roles: [userRoleInactiveBookings],
      }).toHavePermissionFlags({
        read: false,
        write: false,
        prisonUser: false,
        globalSearch: false,
        inactiveBookings: false,
      })
    })
  })

  it('should set all flags for users with all necessary permissions', () => {
    new ExpectUser({
      ...mockUser,
      roles: [userRolePrison, userRoleGlobalSearch, userRoleInactiveBookings, userRoleManageNonAssociations],
    }).toHavePermissionFlags({
      read: true,
      write: true,
      prisonUser: true,
      globalSearch: true,
      inactiveBookings: true,
    })
  })

  describe('should check roles and caseloads', () => {
    describe('and forbid non-prison users from viewing prisoner profiles', () => {
      new ExpectUser(mockNonPrisonUser).canViewSomePrisonerProfiles(['N', 'N', 'N', 'N', 'N'])
    })

    describe('and allow prison users to view profiles in their caseloads', () => {
      new ExpectUser(mockReadOnlyUser).canViewSomePrisonerProfiles(['Y', 'N', 'N', 'N', 'N'])
    })

    describe('and allow prison users with global search to view profiles in their caseloads or in transfer', () => {
      new ExpectUser(mockUserWithGlobalSearch).canViewSomePrisonerProfiles(['Y', 'N', 'Y', 'N', 'N'])
    })

    describe('and allow prison users with inactive bookings to view profiles in their caseloads or outside', () => {
      new ExpectUser(mockUserWithInactiveBookings).canViewSomePrisonerProfiles(['Y', 'N', 'N', 'Y', 'N'])
    })

    describe('and allow prison users with global search and inactive bookings to view profiles in their caseloads, in transfer or outside', () => {
      new ExpectUser(mockUser).canViewSomePrisonerProfiles(['Y', 'N', 'Y', 'Y', 'N'])
    })

    describe('and forbid non-prison users from viewing or modifying any non-associations', () => {
      new ExpectUser(mockNonPrisonUser).cannotViewAnyNonAssociations()
    })

    describe('and allow prison users to view non-associations', () => {
      for (const user of [
        mockReadOnlyUser,
        mockUserWithoutGlobalSearch,
        mockUserWithGlobalSearch,
        mockUserWithInactiveBookings,
        mockUser,
      ]) {
        new ExpectUser(user).canViewSomeNonAssociations([
          ['Y', 'Y', 'Y', 'Y', 'Y'],
          [' ', 'Y', 'Y', 'Y', 'Y'],
          [' ', ' ', 'Y', 'Y', 'Y'],
          [' ', ' ', ' ', 'Y', 'Y'],
          [' ', ' ', ' ', ' ', 'Y'],
        ])
      }
    })

    describe('and allow prison users to only modify non-associations in their caseloads', () => {
      new ExpectUser(mockUserWithoutGlobalSearch).canModifySomeNonAssociations([
        ['Y', 'N', 'N', 'N', 'N'],
        [' ', 'N', 'N', 'N', 'N'],
        [' ', ' ', 'N', 'N', 'N'],
        [' ', ' ', ' ', 'N', 'N'],
        [' ', ' ', ' ', ' ', 'N'],
      ])
    })

    describe('and allow prison users with global search to modify non-associations in transfer or when at least one is in their caseloads', () => {
      new ExpectUser(mockUserWithGlobalSearch).canModifySomeNonAssociations([
        ['Y', 'Y', 'Y', 'N', 'N'],
        [' ', 'N', 'N', 'N', 'N'],
        [' ', ' ', 'Y', 'N', 'N'],
        [' ', ' ', ' ', 'N', 'N'],
        [' ', ' ', ' ', ' ', 'N'],
      ])
    })

    describe('and allow prison users with inactive bookings to modify non-associations in their caseloads or outside', () => {
      new ExpectUser(mockUserWithInactiveBookings).canModifySomeNonAssociations([
        ['Y', 'N', 'N', 'Y', 'N'],
        [' ', 'N', 'N', 'N', 'N'],
        [' ', ' ', 'N', 'N', 'N'],
        [' ', ' ', ' ', 'Y', 'N'],
        [' ', ' ', ' ', ' ', 'N'],
      ])
    })

    describe('and allow prison users with global search and inactive bookings to modify non-associations in transfer, outside or when at least one is in their caseloads', () => {
      new ExpectUser(mockUser).canModifySomeNonAssociations([
        ['Y', 'Y', 'Y', 'Y', 'N'],
        [' ', 'N', 'N', 'N', 'N'],
        [' ', ' ', 'Y', 'Y', 'N'],
        [' ', ' ', ' ', 'Y', 'N'],
        [' ', ' ', ' ', ' ', 'N'],
      ])
    })
  })
})
