import type { RequestHandler } from 'express'
import jwtDecode, { type JwtPayload } from 'jwt-decode'

import logger from '../../logger'

export interface AuthToken extends JwtPayload {
  client_id?: string
  auth_source?: string
  grant_type?: string
  user_name?: string
  authorities?: string[]
  scope?: string[]
}

/**
 * Permits only users with at least one matching role
 */
export default function authorisationMiddleware(authorisedRoles: string[] = []): RequestHandler {
  return (req, res, next) => {
    if (res.locals?.user?.token) {
      const { authorities: roles = [], user_name: username = '(unknown)' } = jwtDecode<AuthToken>(res.locals.user.token)

      if (authorisedRoles.length && !roles.some(role => authorisedRoles.includes(role))) {
        logger.error(`User ${username} is not authorised to access this (missing one of ${authorisedRoles.join(', ')})`)
        return res.redirect('/authError')
      }

      return next()
    }

    req.session.returnTo = req.originalUrl
    return res.redirect('/sign-in')
  }
}
