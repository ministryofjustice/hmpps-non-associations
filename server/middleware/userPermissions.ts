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
   * Can search for prisoners in other prisons
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
   * NB: the same prisoner can be provided into both arguments to check whether a non-association
   * can _potentially_ be added with some other person.
   */
  canWriteNonAssociation(prisoner: { prisonId: string }, otherPrisoner: { prisonId: string }): boolean {
    if (!this.write) {
      return false
    }

    if (!prisoner.prisonId || !otherPrisoner.prisonId) {
      return false
    }

    const prisonerInCaseloads = this.caseloadSet.has(prisoner.prisonId)
    const otherPrisonerInCaseloads = this.caseloadSet.has(otherPrisoner.prisonId)

    if (isBeingTransferred(prisoner)) {
      if (!this.globalSearch) {
        return false
      }
    } else if (isOutside(prisoner)) {
      if (!this.inactiveBookings) {
        return false
      }
    } else if (!prisonerInCaseloads) {
      return this.globalSearch && otherPrisonerInCaseloads
    }

    if (isBeingTransferred(otherPrisoner)) {
      if (!this.globalSearch) {
        return false
      }
    } else if (isOutside(otherPrisoner)) {
      if (!this.inactiveBookings) {
        return false
      }
    } else if (!otherPrisonerInCaseloads) {
      return this.globalSearch && prisonerInCaseloads
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
