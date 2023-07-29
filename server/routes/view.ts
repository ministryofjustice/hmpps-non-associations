import { type RequestHandler, type Response, Router } from 'express'

import logger from '../../logger'
import { nameOfPerson, reversedNameOfPerson } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { NonAssociationsApi, type NonAssociationsList } from '../data/nonAssociationsApi'
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
  'photo' | 'LAST_NAME' | 'reason' | 'role' | 'restrictionType' | 'comment' | 'WHEN_CREATED'
> = [
  {
    column: 'photo',
    escapedHtml: '<span class="govuk-visually-hidden">Photo</span>',
    classes: 'app-view__cell--photo',
    unsortable: true,
  },
  { column: 'LAST_NAME', escapedHtml: 'Prisoner', classes: 'app-view__cell--prisoner' },
  { column: 'reason', escapedHtml: 'Reason', classes: 'app-view__cell--reason', unsortable: true },
  { column: 'role', escapedHtml: 'Role', classes: 'app-view__cell--role', unsortable: true },
  {
    column: 'restrictionType',
    escapedHtml: 'Where to keep apart',
    classes: 'app-view__cell--restriction-type',
    unsortable: true,
  },
  { column: 'comment', escapedHtml: 'Comments', classes: 'app-view__cell--comment', unsortable: true },
  { column: 'WHEN_CREATED', escapedHtml: 'Date added', classes: 'app-view__cell--date-added' },
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function viewRoutes(service: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
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
        columns: tableColumns,
        sortColumn: sortBy,
        order: sortDirection,
        urlPrefix: '?',
      })

      const api = new NonAssociationsApi(res.locals.user.token)
      try {
        nonAssociationsList = await api.listNonAssociations(prisonerNumber, { sortBy, sortDirection })
        nonAssociationsList = await lookUpStaffNames(res, nonAssociationsList)
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

async function lookUpStaffNames(res: Response, nonAssociationsList: NonAssociationsList): Promise<NonAssociationsList> {
  const prisonApi = new PrisonApi(res.locals.user.token)

  const staffUsernames = Array.from(
    new Set(nonAssociationsList.nonAssociations.map(nonAssociation => nonAssociation.authorisedBy)),
  )
  const staffUsers = [
    // known system users should appear here:
    // https://github.com/ministryofjustice/hmpps-non-associations-api/blob/04bf15fd1a7d659abe785749fbedda9f13627fba/src/main/kotlin/uk/gov/justice/digital/hmpps/hmppsnonassociationsapi/HmppsNonAssociationsApi.kt#L9
    { username: 'NON_ASSOCIATIONS_API', firstName: 'System', lastName: '' },

    ...(await Promise.all(staffUsernames.map(username => prisonApi.getStaffDetails(username)))).filter(user => user),
  ]

  return {
    ...nonAssociationsList,
    nonAssociations: nonAssociationsList.nonAssociations.map(nonAssociation => {
      let { authorisedBy } = nonAssociation
      if (nonAssociation.authorisedBy) {
        const staffUser = staffUsers.find(user => nonAssociation.authorisedBy === user.username)
        if (staffUser) {
          authorisedBy = nameOfPerson(staffUser)
        }
      }
      return {
        ...nonAssociation,
        authorisedBy,
      }
    }),
  }
}
