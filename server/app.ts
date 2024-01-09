import express from 'express'
import { NotFound } from 'http-errors'

import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import { metricsMiddleware } from './monitoring/metricsApp'
import { userRolePrison } from './data/constants'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import breadcrumbs from './middleware/breadcrumbs'
import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCsrf from './middleware/setUpCsrf'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'
import getFrontendComponents from './middleware/dpsFrontEndComponents'

import config from './config'
import routes from './routes'
import type { Services } from './services'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(metricsMiddleware)
  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app, services)
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware([userRolePrison]))
  app.use(setUpCsrf())
  app.use(setUpCurrentUser(services))

  app.use(breadcrumbs())
  app.use(getFrontendComponents(services))
  app.use(routes(services))

  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(config.production))

  return app
}
