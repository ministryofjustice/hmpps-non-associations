import type { RequestHandler } from 'express'
import { userRolePrison, userRoleManageNonAssociations } from '../data/constants'

export default function userPermissionFlags(): RequestHandler {
  return (req, res, next) => {
    if (res.locals.user) {
      res.locals.user.permissions = {
        read: false,
        write: false,
      }

      const roles = res.locals.user.roles ?? []
      const hasPrisonRole = roles.includes(userRolePrison)
      const hasManageNonAssociationsRole = roles.includes(userRoleManageNonAssociations)
      if (hasPrisonRole) {
        res.locals.user.permissions.read = true
        if (hasManageNonAssociationsRole) {
          res.locals.user.permissions.write = true
        }
      }
    }
    next()
  }
}
