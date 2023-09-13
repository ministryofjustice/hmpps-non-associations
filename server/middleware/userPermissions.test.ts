import type { Request, Response, NextFunction } from 'express'

import {
  userRolePrison,
  userRoleGlobalSearch,
  userRoleInactiveBookings,
  userRoleManageNonAssociations,
} from '../data/constants'
import type { OffenderSearchResult } from '../data/offenderSearch'
import { davidJones, andrewBrown, maxClarke, joePeters } from '../data/testData/offenderSearch'
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
  }
}

type Scenarios = ReadonlyArray<{
  scenario: string
  user: Express.User
  prisoner: OffenderSearchResult
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

  const allowedScenarios: Scenarios = [
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
      scenario: 'of people not in an establishment if you inactive bookings role',
      user: mockUser,
      prisoner: joePeters,
    },
  ]
  it.each(allowedScenarios)('should allow viewing a profile $scenario', ({ user, prisoner }) => {
    expectUser(user).canViewPrisonerProfile(prisoner)
  })

  const forbiddenScenarios: Scenarios = [
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
      scenario: 'of people not in an establishment if you do not inactive bookings role',
      user: {
        ...mockUser,
        roles: [userRolePrison, userRoleManageNonAssociations, userRoleGlobalSearch],
      },
      prisoner: joePeters,
    },
  ]
  it.each(forbiddenScenarios)('should not allow viewing a profile $scenario', ({ user, prisoner }) => {
    expectUser(user).cannotViewPrisonerProfile(prisoner)
  })
})
