import { type RequestHandler, Router } from 'express'

import logger from '../../logger'
import { nameOfPrisoner, reversedNameOfPrisoner } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { NonAssociationsApi, type NonAssociationsList } from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
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
    } catch (e) {
      logger.error(`Non-associations NOT listed by ${res.locals.user.username} for ${prisonerNumber}`)
      // TODO: show error msg
    }

    res.locals.breadcrumbs.addItems({
      text: reversedNameOfPrisoner(prisoner),
      href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`,
    })
    res.render('pages/view.njk', {
      prisonerNumber,
      prisonerName: nameOfPrisoner(prisoner),
      prisonName: prisoner.prisonName,
      nonAssociationsList,
    })
  })

  return router
}
