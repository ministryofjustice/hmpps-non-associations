import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function viewRoutes(service: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (req, res) => {
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
    res.render('pages/view.njk', {
      prisonerName: 'David Jones',
      nonAssociations: response,
    })
  })

  return router
}
