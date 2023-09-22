import cookieSession from 'cookie-session'
import express, { type Express } from 'express'
import { NotFound } from 'http-errors'

import nunjucksSetup from '../../utils/nunjucksSetup'
import applicationInfo from '../../applicationInfo'
import errorHandler from '../../errorHandler'
import breadcrumbs from '../../middleware/breadcrumbs'
import userPermissions from '../../middleware/userPermissions'
import setUpHealthChecks from '../../middleware/setUpHealthChecks'
import * as auth from '../../authentication/auth'
import {
  userRolePrison,
  userRoleGlobalSearch,
  userRoleInactiveBookings,
  userRoleManageNonAssociations,
} from '../../data/constants'
import HmppsAuthClient from '../../data/hmppsAuthClient'

import routes from '../index'
import type { Caseload } from '../../data/nomisUserRolesApi'
import type { Services } from '../../services'
import routeUrls from '../../services/routeUrls'

jest.mock('../../data/hmppsAuthClient')

export const mockActiveCaseload: Caseload = {
  id: 'MDI',
  name: 'Moorland (HMP & YOI)',
}
export const mockCaseloads: Caseload[] = [mockActiveCaseload]

export const mockUser: Express.User = {
  name: 'FIRST LAST',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  active: true,
  activeCaseLoadId: 'MDI',
  activeCaseload: mockActiveCaseload,
  caseloads: mockCaseloads,
  authSource: 'NOMIS',
  roles: [userRolePrison, userRoleGlobalSearch, userRoleInactiveBookings, userRoleManageNonAssociations],
}

export const mockReadOnlyUser: Express.User = {
  ...mockUser,
  roles: [userRolePrison],
}

export const mockUserWithoutGlobalSearch: Express.User = {
  ...mockUser,
  roles: [userRolePrison, userRoleManageNonAssociations],
}

export const mockUserWithGlobalSearch: Express.User = {
  ...mockUser,
  roles: [userRolePrison, userRoleGlobalSearch, userRoleManageNonAssociations],
}

export const flashProvider = jest.fn()

function appSetup(services: Services, production: boolean, userSupplier: () => Express.User): Express {
  const app = express()

  nunjucksSetup(app, services)
  app.use(cookieSession({ keys: [''] }))
  app.use((req, res, next) => {
    // NB: in reality, req.user != res.locals.user
    req.user = userSupplier()
    req.flash = flashProvider
    res.locals = {} as Express.Locals
    res.locals.user = { ...req.user }
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use(userPermissions())
  app.use(setUpHealthChecks(applicationInfo()))
  app.use(breadcrumbs())
  app.use(routes(services))

  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  production = false,
  services = {},
  userSupplier = () => mockUser,
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => Express.User
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  // eslint-disable-next-line no-param-reassign
  services.routeUrls = routeUrls
  // eslint-disable-next-line no-param-reassign
  services.hmppsAuthClient = new HmppsAuthClient(undefined) // NB: this class is mocked
  return appSetup(services as Services, production, userSupplier)
}
