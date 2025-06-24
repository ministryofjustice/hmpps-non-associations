import {
  ErrorCode,
  isErrorResponse,
  type CreateNonAssociationRequest,
} from '@ministryofjustice/hmpps-non-associations-api'
import { Router } from 'express'
import { NotFound } from 'http-errors'

import logger from '../../logger'
import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import { NonAssociationsApi, maxCommentLength } from '../data/nonAssociationsApi'
import { OffenderSearchClient, type OffenderSearchResult } from '../data/offenderSearch'
import type { Services } from '../services'
import formPostRoute from './forms/post'
import AddForm from '../forms/add'
import { formChoices } from '../forms/nonAssociation'

export default function addRoutes(service: Services): Router {
  const { hmppsAuthClient, routeUrls } = service
  const router = Router({ mergeParams: true })

  const formId = 'add' as const
  formPostRoute(
    router,
    '/',
    {
      [formId]: async (req, res) => {
        const { user } = res.locals
        const { prisonerNumber, otherPrisonerNumber } = req.params

        if (prisonerNumber === otherPrisonerNumber) {
          throw new NotFound('Cannot add a non-association to the same person')
        }

        const systemToken = await hmppsAuthClient.getToken(user.username)
        const offenderSearchClient = new OffenderSearchClient(systemToken)
        const [prisoner, otherPrisoner] = await Promise.all([
          offenderSearchClient.getPrisoner(prisonerNumber),
          offenderSearchClient.getPrisoner(otherPrisonerNumber),
        ])

        if (!user.permissions?.canWriteNonAssociation(prisoner, otherPrisoner)) {
          throw new NotFound(
            `User ${user.username} does not have permissions to add a non-association between ${prisonerNumber} and ${otherPrisonerNumber}`,
          )
        }

        const prisonerName = nameOfPerson(prisoner)
        const otherPrisonerName = nameOfPerson(otherPrisoner)

        Object.assign(res.locals, { systemToken, prisoner, prisonerName, otherPrisoner, otherPrisonerName })

        return new AddForm(prisonerName, otherPrisonerName)
      },
    },
    async (req, res) => {
      const { user } = res.locals
      const { prisonerNumber, otherPrisonerNumber } = req.params
      const { systemToken, prisoner, prisonerName, otherPrisonerName } = res.locals as unknown as {
        systemToken: string
        prisoner: OffenderSearchResult
        prisonerName: string
        otherPrisonerName: string
      }

      const form: AddForm = res.locals.forms[formId]

      res.locals.breadcrumbs.addItems(
        { text: reversedNameOfPerson(prisoner), href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}` },
        { text: 'Non-associations', href: service.routeUrls.list(prisonerNumber) },
      )

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
        const api = new NonAssociationsApi(systemToken)
        try {
          const response = await api.createNonAssociation(request)
          logger.info(
            `Non-association created by ${user.username} between ${prisonerNumber} and ${otherPrisonerNumber} with ID ${response.id}`,
          )

          res.render('pages/addConfirmation.njk', {
            prisonerNumber,
            prisonerName,
          })
          return
        } catch (error) {
          logger.error(
            `Non-association could NOT be created by ${user.username} between ${prisonerNumber} and ${otherPrisonerNumber}!`,
            error,
          )
          const errorResponse = error.data
          if (isErrorResponse(errorResponse) && errorResponse.errorCode === ErrorCode.OpenNonAssociationAlreadyExist) {
            let errorMessage = 'There is already an open non-association between these 2 prisoners'
            const openNonAssociations = await api.listNonAssociationsBetween([prisonerNumber, otherPrisonerNumber])
            if (openNonAssociations.length === 1) {
              const [openNonAssociation] = openNonAssociations
              const link = routeUrls.view(prisonerNumber, openNonAssociation.id)
              errorMessage = `${errorMessage}. <a href="${link}">View the existing non-association</a>`
            }
            req.flash('warningHtml', errorMessage)
          } else {
            req.flash('warning', 'Non-association could not be saved, please try again')
          }
        }
      }

      res.render('pages/add.njk', {
        prisonerNumber,
        prisonerName,
        otherPrisonerNumber,
        otherPrisonerName,
        formId,
        form,
        maxCommentLength,
        ...formChoices(),
      })
    },
  )

  return router
}
