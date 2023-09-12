import type { RequestHandler } from 'express'

import {
  userRolePrison,
  userRoleGlobalSearch,
  userRoleInactiveBookings,
  userRoleManageNonAssociations,
} from '../data/constants'
import { isBeingTransferred, isOutside, type OffenderSearchResult } from '../data/offenderSearch'

export class UserPermissions {
  private caseloadSet: Set<string>

  /**
   * Can view non-associations
   */
  public read = false

  /**
   * Can potentially add, update and close non-associations
   */
  public write = false

  /**
   * Can see prisoners in other prisons
   */
  public globalSearch = false

  /**
   * Can see people released from prison
   */
  public inactiveBookings = false

  constructor(private readonly user: Express.User) {
    const roles = user.roles ?? []
    if (roles.includes(userRolePrison)) {
      this.read = true
      this.write = roles.includes(userRoleManageNonAssociations)
      this.globalSearch = roles.includes(userRoleGlobalSearch)
      this.inactiveBookings = roles.includes(userRoleInactiveBookings)
    }

    this.caseloadSet = new Set(user.caseloads.map(caseload => caseload.id))
  }

  /**
   * Whether prisoner photos and links to their profiles should show
   */
  canViewProfile(prisoner: OffenderSearchResult): boolean {
    if (isBeingTransferred(prisoner)) {
      return this.user.permissions.globalSearch
    }
    if (isOutside(prisoner)) {
      return this.user.permissions.inactiveBookings
    }
    return this.caseloadSet.has(prisoner.prisonId)
  }
}

export default function userPermissions(): RequestHandler {
  return (req, res, next) => {
    if (res.locals.user) {
      res.locals.user.permissions = new UserPermissions(res.locals.user)
    }
    next()
  }
}
