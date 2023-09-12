import type { RequestHandler } from 'express'

import {
  userRolePrison,
  userRoleGlobalSearch,
  userRoleInactiveBookings,
  userRoleManageNonAssociations,
} from '../data/constants'
import { isBeingTransferred, isOutside } from '../data/offenderSearch'

export class UserPermissions {
  private readonly caseloadSet: Set<string>

  /**
   * Can view non-associations
   */
  public readonly read: boolean

  /**
   * Can potentially add, update and close non-associations
   */
  public readonly write: boolean

  /**
   * Can see prisoners in other prisons
   */
  public readonly globalSearch: boolean

  /**
   * Can see people released from prison
   */
  public readonly inactiveBookings: boolean

  constructor(private readonly user: Express.User) {
    this.read = false
    this.write = false
    this.globalSearch = false
    this.inactiveBookings = false

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
  canViewProfile(prisoner: { prisonId: string }): boolean {
    if (isBeingTransferred(prisoner)) {
      return this.user.permissions.globalSearch
    }
    if (isOutside(prisoner)) {
      return this.user.permissions.inactiveBookings
    }
    return this.caseloadSet.has(prisoner.prisonId)
  }

  /**
   * Whether a non-association can be added, updated or closed
   */
  canWriteNonAssociation(prisoner: { prisonId: string }, otherPrisoner: { prisonId: string }): boolean {
    if (!this.write) {
      return false
    }

    if (isBeingTransferred(prisoner)) {
      if (!this.globalSearch) {
        return false
      }
    } else if (isOutside(prisoner)) {
      if (!this.inactiveBookings) {
        return false
      }
    } else if (!this.caseloadSet.has(prisoner.prisonId)) {
      return false
    }

    if (isBeingTransferred(otherPrisoner)) {
      if (!this.globalSearch) {
        return false
      }
    } else if (isOutside(otherPrisoner)) {
      if (!this.inactiveBookings) {
        return false
      }
    } else if (!this.caseloadSet.has(otherPrisoner.prisonId)) {
      return false
    }

    return true
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
