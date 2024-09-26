import flash from 'connect-flash'
import { type RequestHandler, Router } from 'express'
import type { PathParams } from 'express-serve-static-core'
import defaultTokenProvider from '@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/components/report-list/defaultTokenProvider'
import ReportListUtils from '@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/components/report-list/utils'

import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import flashMessages from '../middleware/flashMessages'
import type { Services } from '../services'
import PrisonApi from '../data/prisonApi'
import prisonerSearchRoutes from './prisonerSearch'
import addRoutes from './add'
import closeRoutes from './close'
import listRoutes from './list'
import viewRoutes from './view'
import updateRoutes from './update'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: PathParams, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  router.use(flash())
  router.use(flashMessages())

  const urlTemplates = services.routeUrls.templates

  get(urlTemplates.home, (req, res) => {
    if (process.env.NO_HOME_REDIRECT) {
      res.send('')
      return
    }
    res.redirect(config.dpsUrl)
  })

  get(urlTemplates.prisonerPhoto, async (req, res) => {
    const { user } = res.locals
    const { prisonerNumber } = req.params

    const prisonApi = new PrisonApi(user.token)
    const photoData = await prisonApi.getPhoto(prisonerNumber)

    const oneDay = 86400 as const
    res.setHeader('Cache-Control', `private, max-age=${oneDay}`)
    res.setHeader('Content-Type', 'image/jpeg')

    if (!photoData) {
      res.sendFile('images/prisoner.jpeg', { root: services.applicationInfo.assetsPath })
    } else {
      res.send(photoData)
    }
  })

  get(
    '/reports',
    ReportListUtils.createReportListRequestHandler({
      title: 'Non-associations reports',
      definitionName: 'non-associations',
      variantName: 'all',
      apiUrl: config.apis.hmppsNonAssociationsApi.url,
      apiTimeout: config.apis.hmppsNonAssociationsApi.timeout.deadline,
      layoutTemplate: 'partials/reportsLayout.njk',
      tokenProvider: defaultTokenProvider,
    }),
  )

  router.use(urlTemplates.list, listRoutes(services))

  router.use(urlTemplates.prisonerSearch, prisonerSearchRoutes(services))

  router.use(urlTemplates.add, addRoutes(services))

  router.use(urlTemplates.view, viewRoutes(services))

  router.use(urlTemplates.close, closeRoutes(services))

  router.use(urlTemplates.update, updateRoutes(services))

  return router
}
