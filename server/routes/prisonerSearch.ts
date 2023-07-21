import { Router } from 'express'

import { nameOfPrisoner, reversedNameOfPrisoner } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { OffenderSearchClient, type OffenderSearchResults } from '../data/offenderSearch'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import type { Services } from '../services'
import formGetRoute from './forms/get'
import { pagination, type Pagination } from '../utils/pagination'
import PrisonerSearchForm from '../forms/prisonerSearchForm'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient()))

export default function prisonerSearchRoutes(service: Services): Router {
  const router = Router({ mergeParams: true })

  const formId = 'search' as const
  formGetRoute(
    router,
    '/',
    {
      [formId]: () => new PrisonerSearchForm(),
    },
    asyncMiddleware(async (req, res) => {
      const { user } = res.locals
      const { id: prisonId } = user.activeCaseload
      const { prisonerNumber } = req.params

      const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const offenderSearchClient = new OffenderSearchClient(systemToken)
      const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)

      const form: PrisonerSearchForm | null = res.locals.submittedForm

      let searchResults: OffenderSearchResults | undefined
      let paginationParams: Pagination | undefined
      if (form && !form.hasErrors) {
        const page = form.fields.page.value
        const searchTerms = form.fields.q.value
        const response = await offenderSearchClient.search(prisonId, searchTerms, page - 1)
        if (response.totalElements > 0) {
          const pageCount = Math.ceil(response.totalElements / OffenderSearchClient.PAGE_SIZE)
          const urlPrefix = `?q=${encodeURIComponent(searchTerms)}&formId=${formId}&`
          paginationParams = pagination(page, pageCount, urlPrefix)
        }
        searchResults = response
      }

      res.locals.breadcrumbs.addItems(
        { text: reversedNameOfPrisoner(prisoner), href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}` },
        { text: 'Non-associations', href: service.routeUrls.view(prisonerNumber) },
      )
      res.render('pages/prisonerSearch.njk', {
        prisonerNumber,
        prisonerName: nameOfPrisoner(prisoner),
        formId,
        form,
        searchResults,
        paginationParams,
      })
    }),
  )

  return router
}
