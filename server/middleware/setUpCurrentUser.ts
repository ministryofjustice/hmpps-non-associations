import { Router } from 'express'

import type { Services } from '../services'
import populateCurrentUser from './populateCurrentUser'
import userPermissions from './userPermissions'

export default function setUpCurrentUser({ userService }: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(populateCurrentUser(userService))
  router.use(userPermissions())
  return router
}
