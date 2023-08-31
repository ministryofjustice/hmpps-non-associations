import { Router } from 'express'
import { NotFound } from 'http-errors'

import logger from '../../logger'
import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import {
  NonAssociationsApi,
  type CreateNonAssociationRequest,
  roleOptions,
  reasonOptions,
  restrictionTypeOptions,
  maxCommentLength,
} from '../data/nonAssociationsApi'
import { isOutside, OffenderSearchClient, type OffenderSearchResult } from '../data/offenderSearch'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import type { Services } from '../services'
import formPostRoute from './forms/post'
import AddForm from '../forms/add'
import type { FlashMessages } from './index'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient()))

export default function addRoutes(service: Services): Router {
  const router = Router({ mergeParams: true })

  const formId = 'add' as const
  formPostRoute(
    router,
    '/',
    {
      [formId]: async (req, res) => {
        const { prisonerNumber, otherPrisonerNumber } = req.params

        if (prisonerNumber === otherPrisonerNumber) {
          throw new NotFound('Cannot add a non-association to the same person')
        }

        const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const offenderSearchClient = new OffenderSearchClient(systemToken)
        const [prisoner, otherPrisoner] = await Promise.all([
          offenderSearchClient.getPrisoner(prisonerNumber),
          offenderSearchClient.getPrisoner(otherPrisonerNumber),
        ])
        const prisonerName = nameOfPerson(prisoner)
        const otherPrisonerName = nameOfPerson(otherPrisoner)

        if (isOutside(prisoner)) {
          throw new NotFound(`Cannot add a non-association to someone outside prison: ${prisonerNumber}`)
        }
        if (isOutside(otherPrisoner)) {
          throw new NotFound(`Cannot add a non-association to someone outside prison: ${otherPrisonerNumber}`)
        }

        Object.assign(res.locals, { prisoner, prisonerName, otherPrisoner, otherPrisonerName })

        return new AddForm(prisonerName, otherPrisonerName)
      },
    },
    asyncMiddleware(async (req, res) => {
      const { prisonerNumber, otherPrisonerNumber } = req.params
      const { prisoner, prisonerName, otherPrisonerName } = res.locals as unknown as {
        prisoner: OffenderSearchResult
        prisonerName: string
        otherPrisonerName: string
      }

      const form: AddForm = res.locals.forms[formId]

      res.locals.breadcrumbs.addItems(
        { text: reversedNameOfPerson(prisoner), href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}` },
        { text: 'Non-associations', href: service.routeUrls.list(prisonerNumber) },
      )

      const messages: FlashMessages = {}

      if (form.submitted && !form.hasErrors) {
        const request: CreateNonAssociationRequest = {
          firstPrisonerNumber: prisonerNumber,
          secondPrisonerNumber: otherPrisonerNumber,
          firstPrisonerRole: form.fields.prisonerRole.value,
          secondPrisonerRole: form.fields.otherPrisonerRole.value,
          reason: form.fields.reason.value,
          restrictionType: form.fields.restrictionType.value,
          comment: form.fields.comment.value,
        }
        const api = new NonAssociationsApi(res.locals.user.token)
        try {
          const response = await api.createNonAssociation(request)
          logger.info(
            `Non-association created by ${res.locals.user.username} between ${prisonerNumber} and ${otherPrisonerNumber} with ID ${response.id}`,
          )

          res.render('pages/addConfirmation.njk', {
            prisonerNumber,
            prisonerName,
          })
          return
        } catch (error) {
          logger.error(
            `Non-association could NOT be created by ${res.locals.user.username} between ${prisonerNumber} and ${otherPrisonerNumber}!`,
            error,
          )
          messages.warning = ['Non-association could not be saved, please try again']
        }
      }

      res.render('pages/add.njk', {
        messages,
        prisonerNumber,
        prisonerName,
        otherPrisonerNumber,
        otherPrisonerName,
        formId,
        form,
        roleChoices: Object.entries(roleOptions).map(([key, label]) => {
          return { value: key, text: label }
        }),
        reasonChoices: Object.entries(reasonOptions).map(([key, label]) => {
          return { value: key, text: label }
        }),
        restrictionTypeChoices: Object.entries(restrictionTypeOptions).map(([key, label]) => {
          return { value: key, text: label }
        }),
        maxCommentLength,
      })
    }),
  )

  return router
}
