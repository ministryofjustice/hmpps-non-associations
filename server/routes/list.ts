import { type RequestHandler, Router } from 'express'
import type { PathParams } from 'express-serve-static-core'

import logger from '../../logger'
import format from '../utils/format'
import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import {
  NonAssociationsApi,
  type NonAssociationsList,
  type NonAssociationGroups,
  type SortBy,
  type SortDirection,
  lookupStaffInNonAssociations,
  groupListByLocation,
} from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import PrisonApi from '../data/prisonApi'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import type { Services } from '../services'
import { type HeaderCell, type SortableTableColumns, sortableTableHead } from '../utils/sortableTable'
import ListForm, { type Table } from '../forms/list'
import type { FlashMessages } from './index'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient()))

type Columns = 'photo' | 'LAST_NAME' | 'location' | 'role' | 'restrictionType' | 'WHEN_UPDATED' | 'actions'
const tableColumns: Record<Columns, SortableTableColumns<Columns>[number]> = {
  photo: {
    column: 'photo',
    escapedHtml: '<span class="govuk-visually-hidden">Photo</span>',
    classes: 'app-list__cell--photo',
    unsortable: true,
  },
  LAST_NAME: { column: 'LAST_NAME', escapedHtml: 'Name', classes: 'app-list__cell--prisoner' },
  location: { column: 'location', escapedHtml: 'Location', classes: 'app-list__cell--location', unsortable: true },
  role: { column: 'role', escapedHtml: 'Role', classes: 'app-list__cell--role', unsortable: true },
  restrictionType: {
    column: 'restrictionType',
    escapedHtml: 'Where&nbsp;to keep&nbsp;apart',
    classes: 'app-list__cell--restriction-type',
    unsortable: true,
  },
  WHEN_UPDATED: { column: 'WHEN_UPDATED', escapedHtml: 'Last updated', classes: 'app-list__cell--date-updated' },
  actions: {
    column: 'actions',
    escapedHtml: '<span class="govuk-visually-hidden">Actions</span>',
    classes: 'app-list__cell--actions',
    unsortable: true,
  },
}

function makeTableHead(table: Table, prisonerName: string, sortBy: SortBy, sortDirection: SortDirection): HeaderCell[] {
  return sortableTableHead({
    columns: [
      tableColumns.photo,
      tableColumns.LAST_NAME,
      {
        ...tableColumns.location,
        escapedHtml: table === 'other' || table === 'any' ? 'Establishment' : 'Location',
      },
      {
        ...tableColumns.role,
        escapedHtml: `${format.possessiveName(prisonerName)} role`,
      },
      tableColumns.restrictionType,
      tableColumns.WHEN_UPDATED,
      tableColumns.actions,
    ],
    sortColumn: sortBy,
    order: sortDirection,
    urlPrefix: '?',
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function listRoutes(service: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: PathParams, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get(['/', '/closed'], async (req, res) => {
    const listing: 'open' | 'closed' = req.path.includes('/closed') ? 'closed' : 'open'
    const { prisonerNumber } = req.params

    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const offenderSearchClient = new OffenderSearchClient(systemToken)
    const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)
    const prisonerName = nameOfPerson(prisoner)

    const messages: FlashMessages = {}
    const tableHeads: Partial<Record<Table, HeaderCell[]>> = {}
    let nonAssociationsList: NonAssociationsList
    let nonAssociationGroups: NonAssociationGroups

    const form = new ListForm()
    form.submit(req.query)
    if (!form.hasErrors) {
      const sortBy = form.fields.sort.value
      const sortDirection = form.fields.order.value

      const api = new NonAssociationsApi(res.locals.user.token)
      const prisonApi = new PrisonApi(res.locals.user.token)
      try {
        nonAssociationsList = await api.listNonAssociations(prisonerNumber, {
          includeOpen: listing === 'open',
          includeClosed: listing === 'closed',
          includeOtherPrisons: true,
          sortBy,
          sortDirection,
        })
        nonAssociationsList = await lookupStaffInNonAssociations(prisonApi, nonAssociationsList)
        nonAssociationGroups = groupListByLocation(nonAssociationsList)

        if (nonAssociationGroups.type === 'threeGroups') {
          tableHeads.same = makeTableHead('same', prisonerName, sortBy, sortDirection)
          tableHeads.other = makeTableHead('other', prisonerName, sortBy, sortDirection)
          tableHeads.outside = makeTableHead('outside', prisonerName, sortBy, sortDirection)
        } else if (nonAssociationGroups.type === 'twoGroups') {
          tableHeads.any = makeTableHead('any', prisonerName, sortBy, sortDirection)
          tableHeads.outside = makeTableHead('outside', prisonerName, sortBy, sortDirection)
        }
      } catch (error) {
        logger.error(`Non-associations NOT listed by ${res.locals.user.username} for ${prisonerNumber}`, error)
        messages.warning = ['Non-associations could not be loaded, please try again']
      }
    }

    res.locals.breadcrumbs.addItems({
      text: reversedNameOfPerson(prisoner),
      href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`,
    })
    res.render('pages/list.njk', {
      messages,
      listing,
      prisoner,
      prisonerNumber,
      prisonerName,
      nonAssociationsList,
      nonAssociationGroups,
      tableHeads,
      form,
    })
  })

  return router
}
