import type { RequestHandler } from 'express'
import { userRolePrison, userRoleManageNonAssociations } from '../data/constants'

export default function userPermissionFlags(): RequestHandler {
  return (req, res, next) => {
    if (res.locals.user) {
      const roles = res.locals.user.roles ?? []
      const hasPrisonRole = roles.includes(userRolePrison)
      const hasManageNonAssociationsRole = roles.includes(userRoleManageNonAssociations)

      const permissions = {
        read: false,
        write: false,
      }
      if (hasPrisonRole) {
        permissions.read = true
        if (hasManageNonAssociationsRole) {
          permissions.write = true
        }
      }
      res.locals.user.permissions = permissions as Express.User['permissions']
    }
    next()
  }
}
