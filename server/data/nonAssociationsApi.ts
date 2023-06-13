import config from '../config'
import RestClient from './restClient'

// TODO: this is incomplete
export interface LegacyNonAssociationsList {
  offenderNo: string
  firstName: string
  lastName: string
  nonAssociations: {
    reasonCode: string
    reasonDescription: string
    typeCode: string
    typeDescription: string
    offenderNonAssociation: {
      offenderNo: string
      firstName: string
      lastName: string
    }
    comments: string
  }[]
}

export class NonAssociationsApi extends RestClient {
  constructor(systemToken: string) {
    super('HMPPS Non-associations API', config.apis.hmppsNonAssociationsApi, systemToken)
  }

  /**
   * Retrieves a list of non-associations for given booking number
   * NB: this should not be used generally because non-associations should be a property of a person,
   * not just one of their bookings
   *
   * @deprecated this endpoint is a façade to a legacy prison-api call, will be replaced with a new endpoint and data structure
   */
  getLegacyNonAssociationsList(bookingId: number): Promise<LegacyNonAssociationsList[]> {
    // TODO: does this return a 404 instead of an empty list when booking id has no non-associations?
    return this.get({ path: `/legacy/api/bookings/${encodeURIComponent(bookingId)}/non-association-details` })
  }
}
