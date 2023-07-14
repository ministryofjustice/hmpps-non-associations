import config from '../config'
import RestClient from './restClient'

export type OffenderSearchResult = {
  prisonId: string
  bookingId: number
  prisonerNumber: string
  firstName: string
  lastName: string
}

export type OffenderSearchResults = {
  readonly content: ReadonlyArray<OffenderSearchResult>
  readonly totalElements: number
}

export class OffenderSearchClient extends RestClient {
  static readonly PAGE_SIZE = 20

  constructor(token: string) {
    super('Offender Search API', config.apis.offenderSearchApi, token)
  }

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
