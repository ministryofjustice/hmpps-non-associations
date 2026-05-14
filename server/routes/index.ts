import flash from 'connect-flash'
import { Router } from 'express'

import config from '../config'
import flashMessages from '../middleware/flashMessages'
import type { Services } from '../services'
import prisonerSearchRoutes from './prisonerSearch'
import addRoutes from './add'
import closeRoutes from './close'
import listRoutes from './list'
import viewRoutes from './view'
import updateRoutes from './update'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })

  router.use(flash())
  router.use(flashMessages())

  const urlTemplates = services.routeUrls.templates

  router.get(urlTemplates.home, (req, res) => {
    if (process.env.NO_HOME_REDIRECT) {
      res.send('')
      return
    }
    res.redirect(config.dpsUrl)
  })

  router.get(urlTemplates.prisonerPhoto, async (req, res) => {
    const { prisonerNumber } = req.params

    const photoData = await res.locals.apis.prisonApi.getPhoto(prisonerNumber)

    const oneDay = 86400 as const
    res.setHeader('Cache-Control', `private, max-age=${oneDay}`)
    res.setHeader('Content-Type', 'image/jpeg')

    if (!photoData) {
      res.sendFile('images/prisoner.jpeg', { root: services.applicationInfo.assetsPath })
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
