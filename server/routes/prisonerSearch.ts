import { Router } from 'express'
import { NotFound } from 'http-errors'

import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { isOutside, OffenderSearchClient, type OffenderSearchResults } from '../data/offenderSearch'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import type { Services } from '../services'
import formGetRoute from './forms/get'
import { pagination, type Pagination } from '../utils/pagination'
import { type HeaderCell, type SortableTableColumns, sortableTableHead } from '../utils/sortableTable'
import PrisonerSearchForm from '../forms/prisonerSearchForm'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient()))

const tableColumns: SortableTableColumns<'photo' | 'lastName' | 'prisonerNumber' | 'cellLocation' | 'action'> = [
  { column: 'photo', escapedHtml: '<span class="govuk-visually-hidden">Photo</span>', unsortable: true },
  { column: 'lastName', escapedHtml: 'Name' },
  { column: 'prisonerNumber', escapedHtml: 'Prison number', unsortable: true },
  { column: 'cellLocation', escapedHtml: 'Location', unsortable: true },
  { column: 'action', escapedHtml: '<span class="govuk-visually-hidden">Select prisoner</span>', unsortable: true },
]

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

      if (isOutside(prisoner)) {
        throw new NotFound(`Cannot add a non-association to someone outside prison: ${prisonerNumber}`)
      }

      const form: PrisonerSearchForm | null = res.locals.submittedForm

      let searchResults: OffenderSearchResults | undefined
      let tableHead: HeaderCell[] | undefined
      let paginationParams: Pagination | undefined

      if (form && !form.hasErrors) {
        const page = form.fields.page.value
        const searchTerms = form.fields.q.value
        const sort = form.fields.sort.value
        const order = form.fields.order.value

        const response = await offenderSearchClient.search(prisonId, searchTerms, page - 1, sort, order)

        if (response.totalElements > 0) {
          const pageCount = Math.ceil(response.totalElements / OffenderSearchClient.PAGE_SIZE)
          const paginationUrlPrefixParams = Object.entries({
            q: searchTerms,
            formId,
            sort,
            order,
          }).map(([param, value]) => {
            return `${param}=${encodeURIComponent(value)}`
          })
          const paginationUrlPrefix = `?${paginationUrlPrefixParams.join('&')}&`
          paginationParams = pagination(page, pageCount, paginationUrlPrefix)

          // NB: there's no way to exclude results in offender search so have to hack it; it shouldn't be noticeable
          response.content = response.content.filter(result => {
            if (result.prisonerNumber !== prisonerNumber) {
              return true
            }
            response.totalElements -= 1
            return false
          })
        }

        searchResults = response

        const tableHeadUrlPrefixParams = Object.entries({
          q: searchTerms,
          formId,
          page,
        }).map(([param, value]) => {
          return `${param}=${encodeURIComponent(value)}`
        })
        const tableHeadUrlPrefix = `?${tableHeadUrlPrefixParams.join('&')}&`
        tableHead = sortableTableHead({
          columns: tableColumns,
          sortColumn: sort,
          order,
          urlPrefix: tableHeadUrlPrefix,
        })
      }

      res.locals.breadcrumbs.addItems(
        { text: reversedNameOfPerson(prisoner), href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}` },
        { text: 'Non-associations', href: service.routeUrls.list(prisonerNumber) },
      )
      res.render('pages/prisonerSearch.njk', {
        prisonerNumber,
        prisonerName: nameOfPerson(prisoner),
        formId,
        form,
        searchResults,
        tableHead,
        paginationParams,
      })
    }),
  )

  return router
}
