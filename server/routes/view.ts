import { RequestHandler, Router } from 'express'
import type { PathParams } from 'express-serve-static-core'
import { NotFound } from 'http-errors'

import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { NonAssociationsApi, lookupStaffInNonAssociation } from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import PrisonApi from '../data/prisonApi'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import type { Services } from '../services'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient()))

export default function viewRoutes(service: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: PathParams, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const { prisonerNumber, nonAssociationId: nonAssociationIdStr } = req.params
    const nonAssociationId = parseInt(nonAssociationIdStr, 10)

    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const offenderSearchClient = new OffenderSearchClient(systemToken)
    const api = new NonAssociationsApi(res.locals.user.token)

    let nonAssociation = await api.getNonAssociation(nonAssociationId)

    if (
      nonAssociation.firstPrisonerNumber !== prisonerNumber &&
      nonAssociation.secondPrisonerNumber !== prisonerNumber
    ) {
      throw NotFound(`Non-association ${nonAssociationId} does not involve ${prisonerNumber}`)
    }

    const keyPrisonerIsFirst = nonAssociation.firstPrisonerNumber === prisonerNumber
    const otherPrisonerNumber = keyPrisonerIsFirst
      ? nonAssociation.secondPrisonerNumber
      : nonAssociation.firstPrisonerNumber

    const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)
    const prisonerName = nameOfPerson(prisoner)
    const otherPrisoner = await offenderSearchClient.getPrisoner(otherPrisonerNumber)
    const otherPrisonerName = nameOfPerson(otherPrisoner)

    const prisonApi = new PrisonApi(res.locals.user.token)
    nonAssociation = await lookupStaffInNonAssociation(prisonApi, nonAssociation)

    res.locals.breadcrumbs.addItems(
      {
        text: reversedNameOfPerson(prisoner),
        href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`,
      },
      {
        text: 'Non-associations',
        href: service.routeUrls.list(prisonerNumber, nonAssociation.isClosed),
      },
    )
    res.render('pages/view.njk', {
      keyPrisonerIsFirst,
      prisoner,
      prisonerNumber,
      prisonerName,
      prisonName: prisoner.prisonName,
      otherPrisoner,
      otherPrisonerNumber,
      otherPrisonerName,
      nonAssociation,
    })
  })

  return router
}
