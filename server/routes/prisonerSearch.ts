import { Router } from 'express'
import { NotFound } from 'http-errors'

import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { OffenderSearchClient, type OffenderSearchResults } from '../data/offenderSearch'
import type { Services } from '../services'
import formGetRoute from './forms/get'
import { pagination, type LegacyPagination } from '../utils/pagination'
import { type HeaderCell, type SortableTableColumns, sortableTableHead } from '../utils/sortableTable'
import PrisonerSearchForm from '../forms/prisonerSearchForm'

const tableColumns: SortableTableColumns<
  'photo' | 'lastName' | 'prisonerNumber' | 'cellLocation' | 'prisonName' | 'action'
> = [
  {
    column: 'photo',
    escapedHtml: '<span class="govuk-visually-hidden">Photo</span>',
    classes: 'app-prisoner-search__cell--photo',
    unsortable: true,
  },
  { column: 'lastName', escapedHtml: 'Name', classes: 'app-prisoner-search__cell--name' },
  {
    column: 'prisonerNumber',
    escapedHtml: 'Prison number',
    classes: 'app-prisoner-search__cell--prisoner-number',
    unsortable: true,
  },
  { column: 'cellLocation', escapedHtml: 'Location', classes: 'app-prisoner-search__cell--location' },
  {
    column: 'prisonName',
    escapedHtml: 'Establishment',
    classes: 'app-prisoner-search__cell--prison-name',
    unsortable: true,
  },
  {
    column: 'action',
    escapedHtml: '<span class="govuk-visually-hidden">Actions</span>',
    classes: 'app-prisoner-search__cell--actions',
    unsortable: true,
  },
]

export default function prisonerSearchRoutes(service: Services): Router {
  const { hmppsAuthClient } = service
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
      const { id: prisonId, name: prisonName } = user.activeCaseload
      const { prisonerNumber } = req.params

      const systemToken = await hmppsAuthClient.getSystemClientToken(user.username)
      const offenderSearchClient = new OffenderSearchClient(systemToken)
      const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)

      if (!user.permissions?.canWriteNonAssociation(prisoner, prisoner)) {
        throw new NotFound(
          `User ${user.username} does not have permissions to add non-associations for ${prisonerNumber}`,
        )
      }

      const form: PrisonerSearchForm | null = res.locals.submittedForm

      let searchResults: OffenderSearchResults | undefined
      const openNonAssociationsMap: Map<string, number> = new Map() // prisoner number → non-association id
      let tableHead: HeaderCell[] | undefined
      let paginationParams: LegacyPagination | undefined

      if (form && !form.hasErrors) {
        const page = form.fields.page.value
        const scope = form.fields.scope.value
        const searchTerms = form.fields.q.value
        const sort = form.fields.sort.value
        const order = form.fields.order.value

        let response: OffenderSearchResults
        const globalSearch = scope === 'global'
        if (globalSearch) {
          const filters: Parameters<OffenderSearchClient['searchGlobally']>[0] = {
            location: 'ALL',
            includeAliases: true,
          }
          if (/\d/.test(searchTerms)) {
            // DPS global search assumes the whole query is a prisoner identifier if it contains numbers
            filters.prisonerIdentifier = searchTerms.toUpperCase()
          } else {
            // DPS global search assumes that up to 2 words are entered, being the last and first name in that order
            const [lastName, firstName] = searchTerms.split(' ')
            filters.lastName = lastName
            if (firstName?.length) {
              filters.firstName = firstName
            }
          }
          response = await offenderSearchClient.searchGlobally(filters, page - 1)
        } else {
          response = await offenderSearchClient.searchInPrison(prisonId, searchTerms, page - 1, sort, order)
        }

        if (response.totalElements > 0) {
          const pageCount = Math.ceil(response.totalElements / OffenderSearchClient.PAGE_SIZE)
          const paginationUrlPrefixParams = Object.entries(
            globalSearch
              ? {
                  scope: 'global',
                  q: searchTerms,
                  formId,
                }
              : {
                  q: searchTerms,
                  formId,
                  sort,
                  order,
                },
          ).map(([param, value]) => {
            return `${param}=${encodeURIComponent(value)}`
          })
          const paginationUrlPrefix = `?${paginationUrlPrefixParams.join('&')}&`
          paginationParams = pagination(
            page,
            pageCount,
            paginationUrlPrefix,
            'moj',
            response.totalElements,
            OffenderSearchClient.PAGE_SIZE,
          )
          paginationParams.results.text = 'prisoners'

          // NB: there's no way to exclude results in offender search so have to hack it; it shouldn't be noticeable
          response.content = response.content.filter(result => {
            if (result.prisonerNumber !== prisonerNumber) {
              return true
            }
            response.totalElements -= 1
            return false
          })

          const api = new NonAssociationsApi(systemToken)
          const openNonAssociations = await api.listNonAssociationsBetween([
            prisonerNumber,
            ...response.content.map(somePrisoner => somePrisoner.prisonerNumber),
          ])
          openNonAssociations?.forEach(nonAssociation => {
            if (nonAssociation.firstPrisonerNumber === prisonerNumber) {
              openNonAssociationsMap.set(nonAssociation.secondPrisonerNumber, nonAssociation.id)
            } else if (nonAssociation.secondPrisonerNumber === prisonerNumber) {
              openNonAssociationsMap.set(nonAssociation.firstPrisonerNumber, nonAssociation.id)
            }
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
          columns: tableColumns.map(column => {
            return {
              ...column,
              unsortable: globalSearch ? true : column?.unsortable,
            }
          }),
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
        prisoner,
        prisonName,
        prisonerNumber,
        prisonerName: nameOfPerson(prisoner),
        formId,
        form,
        searchResults,
        openNonAssociationsMap,
        tableHead,
        paginationParams,
      })
    }),
  )

  return router
}
