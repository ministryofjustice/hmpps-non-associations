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

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient()))

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function viewRoutes(service: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const { prisonerNumber } = req.params

    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const offenderSearchClient = new OffenderSearchClient(systemToken)
    const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)

    const api = new NonAssociationsApi(res.locals.user.token)
    let nonAssociationsList: NonAssociationsList
    try {
      nonAssociationsList = await api.listNonAssociations(prisonerNumber)
      nonAssociationsList = await lookUpStaffNames(res, nonAssociationsList)
    } catch (e) {
      logger.error(`Non-associations NOT listed by ${res.locals.user.username} for ${prisonerNumber}`)
      // TODO: show error msg
    }

    res.locals.breadcrumbs.addItems({
      text: reversedNameOfPerson(prisoner),
      href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`,
    })
    res.render('pages/view.njk', {
      prisonerNumber,
      prisonerName: nameOfPerson(prisoner),
      prisonName: prisoner.prisonName,
      nonAssociationsList,
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
