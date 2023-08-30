import config from '../config'
import RestClient from './restClient'

interface BaseOffenderSearchResult {
  bookingId: number
  prisonerNumber: string
  firstName: string
  lastName: string
}

export interface OffenderSearchResultIn extends BaseOffenderSearchResult {
  prisonId: string
  prisonName: string
  cellLocation: string
}

export interface OffenderSearchResultTransfer extends BaseOffenderSearchResult {
  prisonId: 'TRN'
  prisonName: string
  locationDescription: string
}

export interface OffenderSearchResultOut extends BaseOffenderSearchResult {
  prisonId: 'OUT'
  prisonName: string
  locationDescription: string
}

export type OffenderSearchResult = OffenderSearchResultIn | OffenderSearchResultTransfer | OffenderSearchResultOut

export type OffenderSearchResults = {
  content: OffenderSearchResult[]
  totalElements: number
}

export const sortOptions = ['lastName', 'firstName', 'prisonerNumber'] as const
export type Sort = (typeof sortOptions)[number]

export const orderOptions = ['ASC', 'DESC'] as const
export type Order = (typeof orderOptions)[number]

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
  search(
    prisonId: string,
    term: string,
    page: number = 0,
    sort: Sort = 'lastName',
    order: Order = 'ASC',
  ): Promise<OffenderSearchResults> {
    return this.get<OffenderSearchResults>({
      path: `/prison/${encodeURIComponent(prisonId)}/prisoners`,
      query: {
        term,
        size: OffenderSearchClient.PAGE_SIZE,
        page,
        sort: `${sort},${order}`,
      },
    })
  }
}
