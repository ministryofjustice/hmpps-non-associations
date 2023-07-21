import config from '../config'
import RestClient from './restClient'

export type OffenderSearchResult = {
  prisonId: string
  bookingId: number
  prisonerNumber: string
  firstName: string
  lastName: string
  cellLocation: string
}

export type OffenderSearchResults = {
  content: OffenderSearchResult[]
  totalElements: number
}

export class OffenderSearchClient extends RestClient {
  static readonly PAGE_SIZE = 20

  constructor(token: string) {
    super('Offender Search API', config.apis.offenderSearchApi, token)
  }

  /**
   * Find a single person by prisoner number
   */
  getPrisoner(prisonerNumber: string): Promise<OffenderSearchResult> {
    return this.get<OffenderSearchResult>({
      path: `/prisoner/${encodeURIComponent(prisonerNumber)}`,
    })
  }

  /**
   * Search for people in a given prison using a search term (which works with names and prisoner numbers)
   */
  search(prisonId: string, term: string, page: number = 0): Promise<OffenderSearchResults> {
    return this.get<OffenderSearchResults>({
      path: `/prison/${encodeURIComponent(prisonId)}/prisoners`,
      query: {
        term,
        size: OffenderSearchClient.PAGE_SIZE,
        page,
      },
    })
  }
}
