import { Router } from 'express'
import { NotFound } from 'http-errors'

import logger from '../../logger'
import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { OffenderSearchClient, type OffenderSearchResult } from '../data/offenderSearch'
import { NonAssociationsApi, maxCommentLength, type CloseNonAssociationRequest } from '../data/nonAssociationsApi'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import type { Services } from '../services'
import formPostRoute from './forms/post'
import CloseForm from '../forms/close'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient()))

export default function addRoutes(service: Services): Router {
  const router = Router({ mergeParams: true })

  const formId = 'close' as const
  formPostRoute(
    router,
    '/',
    {
      [formId]: () => new CloseForm(),
    },
    asyncMiddleware(async (req, res) => {
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
      const firstPrisoner = await offenderSearchClient.getPrisoner(nonAssociation.firstPrisonerNumber)
      const secondPrisoner = await offenderSearchClient.getPrisoner(nonAssociation.secondPrisonerNumber)
      let prisoner: OffenderSearchResult
      if (keyPrisonerIsFirst) {
        prisoner = firstPrisoner
      } else if (keyPrisonerIsSecond) {
        prisoner = secondPrisoner
      }
      const prisonerName = nameOfPerson(prisoner)

      res.locals.breadcrumbs.addItems(
        { text: reversedNameOfPerson(prisoner), href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}` },
        { text: 'Non-associations', href: service.routeUrls.view(prisonerNumber) },
      )

      const form: CloseForm = res.locals.forms[formId]
      if (form.submitted && !form.hasErrors) {
        const request: CloseNonAssociationRequest = {
          closureReason: form.fields.closureReason.value,
        }
        try {
          const response = await api.closeNonAssociation(nonAssociationId, request)
          logger.info(`Non-association [${response.id}] closed by ${res.locals.user.username}`)

          res.render('pages/closeConfirmation.njk', {
            prisonerNumber,
            prisonerName,
          })
          return
        } catch (error) {
          logger.error(
            `Non-association [${nonAssociationId}] could NOT be closed by ${res.locals.user.username}!`,
            error,
          )
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
