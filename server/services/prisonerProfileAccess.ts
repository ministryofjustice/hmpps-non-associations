import { isBeingTransferred, isOutside, type OffenderSearchResult } from '../data/offenderSearch'

export default class PrisonerProfileAccess {
  private caseloadSet: Set<string>

  constructor(private readonly user: Express.User) {
    this.caseloadSet = new Set(user.caseloads.map(caseload => caseload.id))
  }

  canView(prisoner: OffenderSearchResult): boolean {
    if (isBeingTransferred(prisoner)) {
      return this.user.permissions.globalSearch
    }
    if (isOutside(prisoner)) {
      return this.user.permissions.inactiveBookings
    }
    return this.caseloadSet.has(prisoner.prisonId)
  }
}
