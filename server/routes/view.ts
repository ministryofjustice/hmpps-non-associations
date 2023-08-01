import { type RequestHandler, Router } from 'express'
import type { PathParams } from 'express-serve-static-core'

import logger from '../../logger'
import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { NonAssociationsApi, type NonAssociationsList, lookupStaffInNonAssociations } from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import PrisonApi from '../data/prisonApi'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import type { Services } from '../services'
import { type HeaderCell, type SortableTableColumns, sortableTableHead } from '../utils/sortableTable'
import ViewForm from '../forms/view'
import type { FlashMessages } from './index'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient()))

const tableColumns: SortableTableColumns<
  'photo' | 'LAST_NAME' | 'reason' | 'role' | 'restrictionType' | 'comment' | 'WHEN_UPDATED' | 'actions'
> = [
  {
    column: 'photo',
    escapedHtml: '<span class="govuk-visually-hidden">Photo</span>',
    classes: 'app-view__cell--photo',
    unsortable: true,
  },
  { column: 'LAST_NAME', escapedHtml: 'Prisoner details', classes: 'app-view__cell--prisoner' },
  { column: 'reason', escapedHtml: 'Reason', classes: 'app-view__cell--reason', unsortable: true },
  { column: 'role', escapedHtml: 'Role', classes: 'app-view__cell--role', unsortable: true },
  {
    column: 'restrictionType',
    escapedHtml: 'Where to keep apart',
    classes: 'app-view__cell--restriction-type',
    unsortable: true,
  },
  { column: 'comment', escapedHtml: 'Comments', classes: 'app-view__cell--comment', unsortable: true },
  { column: 'WHEN_UPDATED', escapedHtml: 'Last updated', classes: 'app-view__cell--date-updated' },
  { column: 'actions', escapedHtml: 'Actions', classes: 'app-view__cell--actions', unsortable: true },
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function viewRoutes(service: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: PathParams, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get(['/', '/closed'], async (req, res) => {
    const listing: 'open' | 'closed' = req.path.includes('/closed') ? 'closed' : 'open'
    const { prisonerNumber } = req.params

    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const offenderSearchClient = new OffenderSearchClient(systemToken)
    const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)

    const messages: FlashMessages = {}
    let tableHead: HeaderCell[]
    let nonAssociationsList: NonAssociationsList

    const form = new ViewForm()
    form.submit(req.query)
    if (!form.hasErrors) {
      const sortBy = form.fields.sort.value
      const sortDirection = form.fields.order.value
      tableHead = sortableTableHead({
        columns: listing === 'closed' ? tableColumns.slice(0, -1) : tableColumns,
        sortColumn: sortBy,
        order: sortDirection,
        urlPrefix: '?',
      })

      const api = new NonAssociationsApi(res.locals.user.token)
      const prisonApi = new PrisonApi(res.locals.user.token)
      try {
        nonAssociationsList = await api.listNonAssociations(prisonerNumber, {
          includeOpen: listing === 'open',
          includeClosed: listing === 'closed',
          sortBy,
          sortDirection,
        })
        nonAssociationsList = await lookupStaffInNonAssociations(prisonApi, nonAssociationsList)
      } catch (error) {
        logger.error(`Non-associations NOT listed by ${res.locals.user.username} for ${prisonerNumber}`, error)
        messages.warning = ['Non-associations could not be loaded, please try again']
      }
    }

    res.locals.breadcrumbs.addItems({
      text: reversedNameOfPerson(prisoner),
      href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`,
    })
    res.render('pages/view.njk', {
      messages,
      listing,
      prisonerNumber,
      prisonerName: nameOfPerson(prisoner),
      prisonName: prisoner.prisonName,
      nonAssociationsList,
      tableHead,
      form,
    })
  })

  return router
}
