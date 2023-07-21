import { type RequestHandler, Router } from 'express'

import { nameOfPrisoner, reversedNameOfPrisoner } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
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

    const response = [
      {
        otherPrisonerName: 'Broadstairs, Liam',
        otherPrisonerNumber: 'A8469DY',
        reason: 'Bullying',
        role: 'Perpetrator',
        whereToKeepApart: 'Cell',
        comments:
          'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus.',
        dateAdded: '24 May 2023 by Mary Smith',
      },
    ]

    res.locals.breadcrumbs.addItems({
      text: reversedNameOfPrisoner(prisoner),
      href: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`,
    })
    res.render('pages/view.njk', {
      prisonerNumber,
      prisonerName: nameOfPrisoner(prisoner),
      nonAssociations: response,
    })
  })

  return router
}
