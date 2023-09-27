import { Router } from 'express'
import { NotFound } from 'http-errors'

import logger from '../../logger'
import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { OffenderSearchClient, type OffenderSearchResult } from '../data/offenderSearch'
import { NonAssociationsApi, maxCommentLength, type CloseNonAssociationRequest } from '../data/nonAssociationsApi'
import type { Services } from '../services'
import formPostRoute from './forms/post'
import CloseForm from '../forms/close'

export default function addRoutes(service: Services): Router {
  const { hmppsAuthClient } = service
  const router = Router({ mergeParams: true })

  const formId = 'close' as const
  formPostRoute(
    router,
    '/',
    {
      [formId]: () => new CloseForm(),
    },
    asyncMiddleware(async (req, res) => {
      const { user } = res.locals
      const { prisonerNumber, nonAssociationId: nonAssociationIdStr } = req.params
      const nonAssociationId = parseInt(nonAssociationIdStr, 10)

      if (!user.permissions?.write) {
        throw new NotFound(`User ${user.username} does not have write permissions`)
      }

      const systemToken = await hmppsAuthClient.getSystemClientToken(user.username)
      const api = new NonAssociationsApi(systemToken)
      const nonAssociation = await api.getNonAssociation(nonAssociationId)

      if (nonAssociation.isClosed) {
        throw NotFound(`Non-association ${nonAssociationId} is closed and can't be edited`)
      }

      const keyPrisonerIsFirst = nonAssociation.firstPrisonerNumber === prisonerNumber
      const keyPrisonerIsSecond = nonAssociation.secondPrisonerNumber === prisonerNumber
      if (!(keyPrisonerIsFirst || keyPrisonerIsSecond)) {
        throw NotFound(`Non-association ${nonAssociationId} does not involve prisoner ${prisonerNumber}`)
      }

      const offenderSearchClient = new OffenderSearchClient(systemToken)
      const firstPrisoner = await offenderSearchClient.getPrisoner(nonAssociation.firstPrisonerNumber)
      const secondPrisoner = await offenderSearchClient.getPrisoner(nonAssociation.secondPrisonerNumber)

      if (!user.permissions?.canWriteNonAssociation(firstPrisoner, secondPrisoner)) {
        throw new NotFound(
          `User ${user.username} does not have permissions to close a non-association between ${firstPrisoner.prisonerNumber} and ${secondPrisoner.prisonerNumber}`,
        )
      }

      let prisoner: OffenderSearchResult
      if (keyPrisonerIsFirst) {
        prisoner = firstPrisoner
      } else if (keyPrisonerIsSecond) {
        prisoner = secondPrisoner
      }
      const prisonerName = nameOfPerson(prisoner)

      res.locals.breadcrumbs.addItems(
        { text: reversedNameOfPerson(prisoner), href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}` },
        { text: 'Non-associations', href: service.routeUrls.list(prisonerNumber) },
      )

      const form: CloseForm = res.locals.forms[formId]
      if (form.submitted && !form.hasErrors) {
        const request: CloseNonAssociationRequest = {
          closedReason: form.fields.closedReason.value,
        }
        try {
          const response = await api.closeNonAssociation(nonAssociationId, request)
          logger.info(`Non-association [${response.id}] closed by ${user.username}`)

          res.render('pages/closeConfirmation.njk', {
            prisonerNumber,
            prisonerName,
          })
          return
        } catch (error) {
          logger.error(`Non-association [${nonAssociationId}] could NOT be closed by ${user.username}!`, error)
          req.flash('warning', 'Non-association could not be closed, please try again')
        }
      }
      res.render('pages/close.njk', {
        prisonerNumber,
        prisonerName,
        nonAssociation,
        keyPrisonerIsFirst,
        keyPrisonerIsSecond,
        firstPrisoner,
        secondPrisoner,
        formId,
        form,
        maxCommentLength,
      })
    }),
  )

  return router
}
