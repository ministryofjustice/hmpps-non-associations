import { type RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'

import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { OffenderSearchClient } from '../data/offenderSearch'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import type { Services } from '../services'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient()))

export default function addRoutes(service: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const { prisonerNumber, nonAssociationId: nonAssociationIdStr } = req.params
    const nonAssociationId = parseInt(nonAssociationIdStr, 10)

    const api = new NonAssociationsApi(res.locals.user.token)
    const nonAssociation = await api.getNonAssociation(nonAssociationId)

    const keyPrisonerIsFirst = nonAssociation.firstPrisonerNumber === prisonerNumber
    const keyPrisonerIsSecond = nonAssociation.secondPrisonerNumber === prisonerNumber
    if (!(keyPrisonerIsFirst || keyPrisonerIsSecond)) {
      throw NotFound(`Non-association ${nonAssociationId} does not involve prisoner ${prisonerNumber}`)
    }

    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const offenderSearchClient = new OffenderSearchClient(systemToken)
    const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)

    res.locals.breadcrumbs.addItems(
      { text: reversedNameOfPerson(prisoner), href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}` },
      { text: 'Non-associations', href: service.routeUrls.view(prisonerNumber) },
    )
    res.render('pages/close.njk', {
      prisonerNumber,
      prisonerName: nameOfPerson(prisoner),
      nonAssociation,
    })
  })

  return router
}
