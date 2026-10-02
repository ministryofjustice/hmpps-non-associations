import { Router } from 'express'
import { jwtDecode } from 'jwt-decode'

import logger from '../../logger'
import type { Services } from '../services'
import userPermissions from './userPermissions'

export default function setUpCurrentUser({ userService }: Services): Router {
  const router = Router()

  router.use(async (req, res, next) => {
    try {
      if (res.locals.user) {
        const user = await userService.getUser(res.locals.user.token)
        if (user) {
          // userUuid is created by HMPPS Auth and identifies the person across all auth sources
          const { user_id: userId, user_uuid: userUuid } = jwtDecode<{ user_id?: string; user_uuid?: string }>(
            res.locals.user.token,
          )
          res.locals.user = { ...user, ...res.locals.user, userId: userId ?? user.userId, userUuid }
        } else {
          logger.info('No user available')
        }
      }
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve user for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  })

  router.use(userPermissions())

  return router
}
