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
  mockMovePrisoner,
} from '../data/testData/offenderSearch'
import { mockUser, mockCaseloads } from '../routes/testutils/appSetup'
import userPermissions from './userPermissions'

function expectUser(user: Express.User) {
  const req = jest.fn() as unknown as jest.Mocked<Request>
  const res = jest.fn() as unknown as jest.Mocked<Response>
  res.locals = {
    breadcrumbs: undefined,
    user,
  } satisfies Express.Locals
  const next = jest.fn() as unknown as jest.Mocked<NextFunction>

  userPermissions()(req, res, next)

  expect(next).toHaveBeenCalled()

  const { permissions } = res.locals.user

  return {
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

    toNotHaveWritePermission(prisoner: OffenderSearchResult, otherPrisoner: OffenderSearchResult): void {
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
    expectUser({
      ...mockUser,
      roles: [],
    }).toHavePermissionFlags({
      read: false,
      write: false,
      globalSearch: false,
      inactiveBookings: false,
    })
  })

  it('should set read flag if user has necessary role', () => {
    expectUser({
      ...mockUser,
      roles: [userRolePrison],
    }).toHavePermissionFlags({
      read: true,
      write: false,
      globalSearch: false,
      inactiveBookings: false,
    })
  })

  it('should set read & write flags if user has necessary roles', () => {
    expectUser({
      ...mockUser,
      roles: [userRolePrison, userRoleManageNonAssociations],
    }).toHavePermissionFlags({
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
      expectUser({
        ...mockUser,
        roles: [userRolePrison, userRoleGlobalSearch, userRoleManageNonAssociations],
      }).toHavePermissionFlags({
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
        scenario: 'key prisoner is not in your caseloads',
        user: mockUser,
        prisoner: andrewBrown,
        otherPrisoner: davidJones,
      },
      {
        scenario: 'other prisoner is not in your caseloads',
        user: mockUser,
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
    ] satisfies HasWritePermissionScenarios)('$scenario', ({ user, prisoner, otherPrisoner }) => {
      expectUser(user).toNotHaveWritePermission(prisoner, otherPrisoner)
    })
  })
})
