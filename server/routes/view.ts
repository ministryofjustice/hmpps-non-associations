import { RequestHandler, Router } from 'express'
import type { PathParams } from 'express-serve-static-core'
import { NotFound } from 'http-errors'

import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { NonAssociationsApi, lookupStaffInNonAssociation } from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import PrisonApi from '../data/prisonApi'
import type { Services } from '../services'

export default function viewRoutes(service: Services): Router {
  const { hmppsAuthClient } = service
  const router = Router({ mergeParams: true })
  const get = (path: PathParams, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const { user } = res.locals
    const { prisonerNumber, nonAssociationId: nonAssociationIdStr } = req.params
    const nonAssociationId = parseInt(nonAssociationIdStr, 10)

    if (!user.permissions?.read) {
      throw new NotFound(`User ${user.username} does not have read permissions`)
    }

    const systemToken = await hmppsAuthClient.getSystemClientToken(user.username)
    const offenderSearchClient = new OffenderSearchClient(systemToken)
    const api = new NonAssociationsApi(systemToken)

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

    const prisonApi = new PrisonApi(systemToken)
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
