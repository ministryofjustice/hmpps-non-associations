import { Router } from 'express'
import { NotFound } from 'http-errors'

import logger from '../../logger'
import { nameOfPrisoner, reversedNameOfPrisoner } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { OffenderSearchClient } from '../data/offenderSearch'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import type { Services } from '../services'
import formPostRoute from './forms/post'
import AddForm, { roleOptions, reasonOptions, restrictionTypeOptions, maxCommentLength } from '../forms/add'

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
        const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)
        const otherPrisoner = await offenderSearchClient.getPrisoner(otherPrisonerNumber)
        const prisonerName = nameOfPrisoner(prisoner)
        const otherPrisonerName = nameOfPrisoner(otherPrisoner)

        Object.assign(res.locals, { prisoner, prisonerName, otherPrisoner, otherPrisonerName })

        return new AddForm(prisonerName, otherPrisonerName)
      },
    },
    asyncMiddleware(async (req, res) => {
      const { prisonerNumber, otherPrisonerNumber } = req.params
      const { prisoner, prisonerName, otherPrisonerName } = res.locals

      const form: AddForm = res.locals.forms[formId]

      res.locals.breadcrumbs.addItems(
        { text: reversedNameOfPrisoner(prisoner), href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}` },
        { text: 'Non-associations', href: service.routeUrls.view(prisonerNumber) },
      )

      if (form.submitted && !form.hasErrors) {
        const payload = {
          prisonerRole: form.fields.prisonerRole.value,
          otherPrisonerRole: form.fields.otherPrisonerRole.value,
          reason: form.fields.reason.value,
          restrictionType: form.fields.restrictionType.value,
          comment: form.fields.comment.value,
        }
        // TODO: actually call non-associations api
        logger.warn(JSON.stringify(payload))

        res.render('pages/addConfirmation.njk', {
          prisonerNumber,
          prisonerName,
        })
        return
      }

      res.render('pages/add.njk', {
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
