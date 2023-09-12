import type { Request, Response, NextFunction } from 'express'

import {
  userRolePrison,
  userRoleGlobalSearch,
  userRoleInactiveBookings,
  userRoleManageNonAssociations,
} from '../data/constants'
import type { OffenderSearchResult } from '../data/offenderSearch'
import { davidJones, andrewBrown, maxClarke, joePeters } from '../data/testData/offenderSearch'
import userPermissionFlags from '../middleware/userPermissionFlags'
import { mockUser, mockCaseloads } from '../routes/testutils/appSetup'
import PrisonerProfileAccess from './prisonerProfileAccess'

function middleware(user: Express.User): Express.User {
  const req = jest.fn() as unknown as Request
  const res = {
    locals: { user },
  } as unknown as Response
  const next = jest.fn() as unknown as NextFunction
  userPermissionFlags()(req, res, next)
  return res.locals.user
}

type Scenarios = ReadonlyArray<{
  scenario: string
  user: Express.User
  prisoner: OffenderSearchResult
}>

describe('PrisonerProfileAccess', () => {
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
    const prisonerProfileAccess = new PrisonerProfileAccess(middleware(user))
    expect(prisonerProfileAccess.canView(prisoner)).toEqual(true)
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
    const prisonerProfileAccess = new PrisonerProfileAccess(middleware(user))
    expect(prisonerProfileAccess.canView(prisoner)).toEqual(false)
  })
})
