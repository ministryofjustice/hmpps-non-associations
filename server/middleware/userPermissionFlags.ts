import type { RequestHandler } from 'express'
import {
  userRolePrison,
  userRoleGlobalSearch,
  userRoleInactiveBookings,
  userRoleManageNonAssociations,
} from '../data/constants'

export default function userPermissionFlags(): RequestHandler {
  return (req, res, next) => {
    if (res.locals.user) {
      const roles = res.locals.user.roles ?? []
      const permissions = {
        read: false,
        write: false,
        globalSearch: false,
        inactiveBookings: false,
      }
      if (roles.includes(userRolePrison)) {
        permissions.read = true
        permissions.write = roles.includes(userRoleManageNonAssociations)
        permissions.globalSearch = roles.includes(userRoleGlobalSearch)
        permissions.inactiveBookings = roles.includes(userRoleInactiveBookings)
      }
      res.locals.user.permissions = permissions as Express.User['permissions']
    }
    next()
  }
}
