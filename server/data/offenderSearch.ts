import config from '../config'
import { TransferPrisonId, OutsidePrisonId, transferPrisonId, outsidePrisonId } from './constants'
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
  prisonId: TransferPrisonId
  prisonName: string
  locationDescription: string
}

export interface OffenderSearchResultOut extends BaseOffenderSearchResult {
  prisonId: OutsidePrisonId
  prisonName: string
  locationDescription: string
}

export type OffenderSearchResult = OffenderSearchResultIn | OffenderSearchResultTransfer | OffenderSearchResultOut

export function isBeingTransferred(prisoner: OffenderSearchResult): prisoner is OffenderSearchResultTransfer
export function isBeingTransferred(prisonerOrNonAssociation: { prisonId: string }): boolean
export function isBeingTransferred(prisonerOrNonAssociation: { prisonId: string }): boolean {
  return prisonerOrNonAssociation.prisonId === transferPrisonId
}

export function isOutside(prisoner: OffenderSearchResult): prisoner is OffenderSearchResultOut
export function isOutside(prisonerOrNonAssociation: { prisonId: string }): boolean
export function isOutside(prisonerOrNonAssociation: { prisonId: string }): boolean {
  return prisonerOrNonAssociation.prisonId === outsidePrisonId
}

export function isInPrison(prisoner: OffenderSearchResult): prisoner is OffenderSearchResultIn
export function isInPrison(prisonerOrNonAssociation: { prisonId: string }): boolean
export function isInPrison(prisonerOrNonAssociation: { prisonId: string }): boolean {
  return Boolean(
    !isBeingTransferred(prisonerOrNonAssociation) &&
      !isOutside(prisonerOrNonAssociation) &&
      prisonerOrNonAssociation.prisonId,
  )
}

export type OffenderSearchResults = {
  content: OffenderSearchResult[]
  totalElements: number
}

export const sortOptions = ['lastName', 'firstName', 'prisonerNumber', 'cellLocation'] as const
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
  searchInPrison(
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

  /**
   * Search for people globally using a search term (which works with names and prisoner numbers)
   * NB: global search does not support sorting
   */
  searchGlobally(
    filters: {
      prisonerIdentifier?: string
      firstName?: string
      lastName?: string
      location?: 'ALL' | 'IN' | 'OUT'
      includeAliases?: boolean
    },
    page: number = 0,
  ): Promise<OffenderSearchResults> {
    if (!('location' in filters)) {
      // eslint-disable-next-line no-param-reassign
      filters.location = 'ALL'
    }
    if (!('includeAliases' in filters)) {
      // eslint-disable-next-line no-param-reassign
      filters.includeAliases = true
    }
    return this.post<OffenderSearchResults>({
      path: '/global-search',
      query: {
        size: OffenderSearchClient.PAGE_SIZE,
        page: encodeURIComponent(page),
      },
      data: filters,
    })
  }
}
