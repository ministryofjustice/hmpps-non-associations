import {
  type NonAssociationsList,
  type SortBy,
  type SortDirection,
} from '@ministryofjustice/hmpps-non-associations-api'
import { type RequestHandler, Router } from 'express'
import type { PathParams } from 'express-serve-static-core'
import { NotFound } from 'http-errors'

import logger from '../../logger'
import format from '../utils/format'
import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import {
  NonAssociationsApi,
  type NonAssociationGroups,
  lookupStaffInNonAssociations,
  groupListByLocation,
  sortList,
} from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import PrisonApi from '../data/prisonApi'
import type { Services } from '../services'
import { type HeaderCell, type SortableTableColumns, sortableTableHead } from '../utils/sortableTable'
import ListForm, { type ListData, type Table } from '../forms/list'

type Listing = 'open' | 'closed'

type Columns =
  | 'photo'
  | 'LAST_NAME'
  | 'CELL_LOCATION'
  | 'PRISON_NAME'
  | 'role'
  | 'restrictionType'
  | 'WHEN_UPDATED'
  | 'WHEN_CLOSED'
  | 'actions'
const tableColumns: Record<Columns, SortableTableColumns<Columns>[number]> = {
  photo: {
    column: 'photo',
    escapedHtml: '<span class="govuk-visually-hidden">Photo</span>',
    classes: 'app-list__cell--photo',
    unsortable: true,
  },
  LAST_NAME: { column: 'LAST_NAME', escapedHtml: 'Name', classes: 'app-list__cell--prisoner' },
  CELL_LOCATION: {
    column: 'CELL_LOCATION',
    escapedHtml: 'Location',
    classes: 'app-list__cell--location',
  },
  PRISON_NAME: {
    column: 'PRISON_NAME',
    escapedHtml: 'Establishment',
    classes: 'app-list__cell--location',
  },
  role: { column: 'role', escapedHtml: 'Role', classes: 'app-list__cell--role', unsortable: true },
  restrictionType: {
    column: 'restrictionType',
    escapedHtml: 'Where&nbsp;to keep&nbsp;apart',
    classes: 'app-list__cell--restriction-type',
    unsortable: true,
  },
  WHEN_UPDATED: { column: 'WHEN_UPDATED', escapedHtml: 'Last updated', classes: 'app-list__cell--date' },
  WHEN_CLOSED: { column: 'WHEN_CLOSED', escapedHtml: 'Date closed', classes: 'app-list__cell--date' },
  actions: {
    column: 'actions',
    escapedHtml: '<span class="govuk-visually-hidden">Actions</span>',
    classes: 'app-list__cell--actions',
    unsortable: true,
  },
}

function makeTableHead(
  urlPrefix: string,
  table: Table,
  prisonerName: string,
  sortBy: SortBy,
  sortDirection: SortDirection,
  listing: Listing,
): HeaderCell[] {
  const sortParameter: keyof ListData = `${table}Sort`
  const orderParameter: keyof ListData = `${table}Order`

  let locationColumn: SortableTableColumns<Columns>[number]
  if (table === 'other' || table === 'any') {
    locationColumn = tableColumns.PRISON_NAME
  } else if (table === 'outside') {
    locationColumn = {
      ...tableColumns.PRISON_NAME,
      escapedHtml: 'Location',
      unsortable: true,
    }
  } else if (table === 'same') {
    locationColumn = tableColumns.CELL_LOCATION
  } else {
    throw new Error('Unexpected table')
  }

  return sortableTableHead({
    columns: [
      tableColumns.photo,
      tableColumns.LAST_NAME,
      locationColumn,
      {
        ...tableColumns.role,
        escapedHtml: `${format.possessiveName(prisonerName)} role`,
      },
      tableColumns.restrictionType,
      listing === 'open' ? tableColumns.WHEN_UPDATED : tableColumns.WHEN_CLOSED,
      tableColumns.actions,
    ],
    sortColumn: sortBy,
    order: sortDirection,
    urlPrefix,
    sortParameter,
    orderParameter,
  })
}

export default function listRoutes(service: Services): Router {
  const { hmppsAuthClient } = service
  const router = Router({ mergeParams: true })
  const get = (path: PathParams, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get(['/', '/closed'], async (req, res) => {
    const { user } = res.locals
    const listing: Listing = req.path.includes('/closed') ? 'closed' : 'open'
    const { prisonerNumber } = req.params

    if (!user.permissions?.read) {
      throw new NotFound(`User ${user.username} does not have read permissions`)
    }

    const systemToken = await hmppsAuthClient.getSystemClientToken(user.username)
    const offenderSearchClient = new OffenderSearchClient(systemToken)
    const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)
    const prisonerName = nameOfPerson(prisoner)

    const tableHeads: Partial<Record<Table, HeaderCell[]>> = {}
    let nonAssociationsList: NonAssociationsList
    let nonAssociationGroups: NonAssociationGroups

    const form = new ListForm(listing === 'closed' ? 'WHEN_CLOSED' : 'WHEN_UPDATED', 'DESC')
    form.submit(req.query)
    if (!form.hasErrors) {
      const api = new NonAssociationsApi(systemToken)
      const prisonApi = new PrisonApi(systemToken)
      try {
        nonAssociationsList = await api.listNonAssociations(prisonerNumber, {
          includeOpen: listing === 'open',
          includeClosed: listing === 'closed',
          includeOtherPrisons: true,
        })
        nonAssociationsList = await lookupStaffInNonAssociations(prisonApi, nonAssociationsList)
        nonAssociationGroups = groupListByLocation(nonAssociationsList)

        if (nonAssociationGroups.type === 'threeGroups') {
          nonAssociationGroups.same = sortList(
            nonAssociationGroups.same,
            form.fields.sameSort.value,
            form.fields.sameOrder.value,
          )
          tableHeads.same = makeTableHead(
            form.getUrlPrefixForOtherTables('three', 'same'),
            'same',
            prisonerName,
            form.fields.sameSort.value,
            form.fields.sameOrder.value,
            listing,
          )

          nonAssociationGroups.other = sortList(
            nonAssociationGroups.other,
            form.fields.otherSort.value,
            form.fields.otherOrder.value,
          )
          tableHeads.other = makeTableHead(
            form.getUrlPrefixForOtherTables('three', 'other'),
            'other',
            prisonerName,
            form.fields.otherSort.value,
            form.fields.otherOrder.value,
            listing,
          )

          nonAssociationGroups.outside = sortList(
            nonAssociationGroups.outside,
            form.fields.outsideSort.value,
            form.fields.outsideOrder.value,
          )
          tableHeads.outside = makeTableHead(
            form.getUrlPrefixForOtherTables('three', 'outside'),
            'outside',
            prisonerName,
            form.fields.outsideSort.value,
            form.fields.outsideOrder.value,
            listing,
          )
        } else if (nonAssociationGroups.type === 'twoGroups') {
          nonAssociationGroups.any = sortList(
            nonAssociationGroups.any,
            form.fields.anySort.value,
            form.fields.anyOrder.value,
          )
          tableHeads.any = makeTableHead(
            form.getUrlPrefixForOtherTables('two', 'any'),
            'any',
            prisonerName,
            form.fields.anySort.value,
            form.fields.anyOrder.value,
            listing,
          )

          nonAssociationGroups.outside = sortList(
            nonAssociationGroups.outside,
            form.fields.outsideSort.value,
            form.fields.outsideOrder.value,
          )
          tableHeads.outside = makeTableHead(
            form.getUrlPrefixForOtherTables('two', 'outside'),
            'outside',
            prisonerName,
            form.fields.outsideSort.value,
            form.fields.outsideOrder.value,
            listing,
          )
        }
      } catch (error) {
        logger.error(`Non-associations NOT listed by ${user.username} for ${prisonerNumber}`, error)
        req.flash('warning', 'Non-associations could not be loaded, please try again')
      }
    }

    const canAddNonAssociation = user.permissions.canWriteNonAssociation(prisoner, prisoner)

    res.locals.breadcrumbs.addItems({
      text: reversedNameOfPerson(prisoner),
      href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`,
    })
    res.render('pages/list.njk', {
      user,
      listing,
      prisoner,
      prisonerNumber,
      prisonerName,
      nonAssociationsList,
      nonAssociationGroups,
      tableHeads,
      form,
      canAddNonAssociation,
    })
  })

  return router
}
