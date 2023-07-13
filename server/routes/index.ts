import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import prisonerSearchRoutes from './prisonerSearch'
import addRoutes from './add'
import viewRoutes from './view'

export default function routes(services: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (req, res, next) => {
    res.render('pages/index')
  })

  router.use('/prisoner/:prisonerNumber/non-associations/add/search-prisoner', prisonerSearchRoutes(services))

  router.use('/prisoner/:prisonerNumber/non-associations/add/with-prisoner/:otherPrisonerNumber', addRoutes(services))

  router.use('/prisoner/:prisonerNumber/non-associations', viewRoutes(services))

  return router
}
