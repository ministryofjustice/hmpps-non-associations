import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function prisonerSearchRoutes(service: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Non-associations', href: req.originalUrl })

    res.render('pages/prisonerSearch.njk')
  })

  return router
}
