import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import prisonerSearchRoutes from './prisonerSearch'
import addRoutes from './add'
import viewRoutes from './view'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const urlTemplates = services.routeUrls.templates

  get(urlTemplates.home, (req, res) => {
    res.render('pages/index')
  })

  router.use(urlTemplates.view, viewRoutes(services))

  router.use(urlTemplates.prisonerSearch, prisonerSearchRoutes(services))

  router.use(urlTemplates.add, addRoutes(services))

  return router
}
