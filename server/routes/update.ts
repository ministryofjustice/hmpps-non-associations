import { Router } from 'express'
import { NotFound } from 'http-errors'

import logger from '../../logger'
import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import {
  NonAssociationsApi,
  type NonAssociation,
  type UpdateNonAssociationRequest,
  roleOptions,
  reasonOptions,
  restrictionTypeOptions,
  maxCommentLength,
} from '../data/nonAssociationsApi'
import { OffenderSearchClient, type OffenderSearchResult } from '../data/offenderSearch'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import type { Services } from '../services'
import formPostRoute from './forms/post'
import UpdateForm from '../forms/update'
import type { FlashMessages } from './index'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient()))

export default function updateRoutes(service: Services): Router {
  const router = Router({ mergeParams: true })

  const formId = 'update' as const
  formPostRoute(
    router,
    '/',
    {
      [formId]: async (req, res) => {
        const { prisonerNumber, nonAssociationId: nonAssociationIdStr } = req.params
        const nonAssociationId = parseInt(nonAssociationIdStr, 10)

        const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const offenderSearchClient = new OffenderSearchClient(systemToken)
        const nonAssociationsApi = new NonAssociationsApi(res.locals.user.token)
        const nonAssociation = await nonAssociationsApi.getNonAssociation(nonAssociationId)

        if (
          nonAssociation.firstPrisonerNumber !== prisonerNumber &&
          nonAssociation.secondPrisonerNumber !== prisonerNumber
        ) {
          throw NotFound(`Non-association ${nonAssociationId} does not involve ${prisonerNumber}`)
        }
        if (nonAssociation.isClosed) {
          throw NotFound(`Non-association ${nonAssociationId} is closed and can't be edited`)
        }

        const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)
        const prisonerName = nameOfPerson(prisoner)
        const otherPrisonerNumber =
          nonAssociation.firstPrisonerNumber === prisonerNumber
            ? nonAssociation.secondPrisonerNumber
            : nonAssociation.firstPrisonerNumber

        const otherPrisoner = await offenderSearchClient.getPrisoner(otherPrisonerNumber)
        const otherPrisonerName = nameOfPerson(otherPrisoner)

        Object.assign(res.locals, { nonAssociation, prisoner, prisonerName, otherPrisoner, otherPrisonerName })

        return new UpdateForm(prisonerName, otherPrisonerName, nonAssociation)
      },
    },
    asyncMiddleware(async (req, res) => {
      const { prisonerNumber } = req.params
      const { nonAssociation, prisoner, prisonerName, otherPrisoner, otherPrisonerName } = res.locals as unknown as {
        nonAssociation: NonAssociation
        prisoner: OffenderSearchResult
        prisonerName: string
        otherPrisoner: OffenderSearchResult
        otherPrisonerName: string
      }
      const otherPrisonerNumber = otherPrisoner.prisonerNumber

      const form: UpdateForm = res.locals.forms[formId]

      res.locals.breadcrumbs.addItems(
        { text: reversedNameOfPerson(prisoner), href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}` },
        { text: 'Non-associations', href: service.routeUrls.list(prisonerNumber) },
      )

      const messages: FlashMessages = {}

      if (form.submitted && !form.hasErrors) {
        const prisonerRoles = [form.fields.prisonerRole.value, form.fields.otherPrisonerRole.value]
        const [firstPrisonerRole, secondPrisonerRole] =
          nonAssociation.firstPrisonerNumber === prisonerNumber ? prisonerRoles : prisonerRoles.reverse()

        const request: UpdateNonAssociationRequest = {
          firstPrisonerRole,
          secondPrisonerRole,
          reason: form.fields.reason.value,
          restrictionType: form.fields.restrictionType.value,
          comment: form.fields.comment.value,
        }
        const api = new NonAssociationsApi(res.locals.user.token)
        try {
          const response = await api.updateNonAssociation(nonAssociation.id, request)
          logger.info(
            `Non-association ${nonAssociation.id} updated by ${res.locals.user.username} between ${prisonerNumber} and ${otherPrisonerNumber} with ID ${response.id}`,
          )

          res.render('pages/updateConfirmation.njk', {
            prisonerNumber,
            prisonerName,
          })
          return
        } catch (error) {
          logger.error(
            `Non-association ${nonAssociation.id} could NOT be updated by ${res.locals.user.username} between ${prisonerNumber} and ${otherPrisonerNumber}!`,
            error,
          )
          messages.warning = ['Non-association could not be updated, please try again']
        }
      }

      // Load existing non-association information in the form if not submitted yet
      if (!form.submitted) {
        // Account for different order of prisoners
        const prisonerRoles = [nonAssociation.firstPrisonerRole, nonAssociation.secondPrisonerRole]
        const [prisonerRole, otherPrisonerRole] =
          nonAssociation.firstPrisonerNumber === prisonerNumber ? prisonerRoles : prisonerRoles.reverse()

        const { reason, restrictionType, comment } = nonAssociation

        form.load({
          prisonerRole,
          otherPrisonerRole,
          reason,
          restrictionType,
          comment,
        })
      }

      res.render('pages/update.njk', {
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
