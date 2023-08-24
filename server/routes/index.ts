import flash from 'connect-flash'
import { type RequestHandler, Router } from 'express'
import type { PathParams } from 'express-serve-static-core'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import PrisonApi from '../data/prisonApi'
import prisonerSearchRoutes from './prisonerSearch'
import addRoutes from './add'
import closeRoutes from './close'
import listRoutes from './list'
import viewRoutes from './view'
import updateRoutes from './update'

export type FlashMessages = {
  information?: string[]
  success?: string[]
  warning?: string[]
}

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: PathParams, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  router.use(flash())

  const urlTemplates = services.routeUrls.templates

  get(urlTemplates.home, (req, res) => {
    res.render('pages/index')
  })

  get(urlTemplates.prisonerPhoto, async (req, res) => {
    const { prisonerNumber } = req.params

    const prisonApi = new PrisonApi(res.locals.user.token)
    const photoData = await prisonApi.getPhoto(prisonerNumber)

    const oneDay = 86400 as const
    res.setHeader('Cache-Control', `private, max-age=${oneDay}`)
    res.setHeader('Content-Type', 'image/jpeg')

    if (!photoData) {
      res.sendFile('prisoner.jpeg', { root: `${services.applicationInfo.packageJsonPath}/assets/images` })
    } else {
      res.send(photoData)
    }
  })

  router.use(urlTemplates.list, listRoutes(services))

  router.use(urlTemplates.prisonerSearch, prisonerSearchRoutes(services))

  router.use(urlTemplates.add, addRoutes(services))

  router.use(urlTemplates.view, viewRoutes(services))

  router.use(urlTemplates.close, closeRoutes(services))

  router.use(urlTemplates.update, updateRoutes(services))

  return router
}
