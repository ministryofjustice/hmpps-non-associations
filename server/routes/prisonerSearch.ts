import { type RequestHandler, Router } from 'express'

import { nameOfPrisoner, reversedNameOfPrisoner } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { OffenderSearchClient } from '../data/offenderSearch'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import type { Services } from '../services'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient()))

export default function prisonerSearchRoutes(service: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const { prisonerNumber } = req.params

    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const offenderSearchClient = new OffenderSearchClient(systemToken)
    const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)

    res.locals.breadcrumbs.addItems(
      { text: reversedNameOfPrisoner(prisoner), href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}` },
      { text: 'Non-associations', href: service.routeUrls.view(prisonerNumber) },
    )
    res.render('pages/prisonerSearch.njk', {
      prisonerNumber,
      prisonerName: nameOfPrisoner(prisoner),
    })
  })

  return router
}
