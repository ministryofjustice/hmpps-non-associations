import { transferPrisonId, outsidePrisonId, type TransferPrisonId, type OutsidePrisonId } from '../constants'
import type {
  OffenderSearchClient,
  OffenderSearchResult,
  OffenderSearchResultIn,
  OffenderSearchResultOut,
  OffenderSearchResultTransfer,
  OffenderSearchResults,
} from '../offenderSearch'
import { mockRestClientError } from './restClientError'

export const davidJones: OffenderSearchResultIn = {
  prisonId: 'MDI',
  prisonName: 'Moorland (HMP)',
  bookingId: 12345,
  prisonerNumber: 'A1234BC',
  firstName: 'DAVID',
  lastName: 'JONES',
  cellLocation: '1-1-001',
}

export const fredMills: OffenderSearchResultIn = {
  prisonId: 'MDI',
  prisonName: 'Moorland (HMP)',
  bookingId: 12346,
  prisonerNumber: 'A1235EF',
  firstName: 'FRED',
  lastName: 'MILLS',
  cellLocation: '1-1-002',
}

export const oscarJones: OffenderSearchResultIn = {
  prisonId: 'MDI',
  prisonName: 'Moorland (HMP)',
  bookingId: 12347,
  prisonerNumber: 'A1236CS',
  firstName: 'OSCAR',
  lastName: 'JONES',
  cellLocation: '1-1-003',
}

export const andrewBrown: OffenderSearchResultIn = {
  prisonId: 'LEI',
  prisonName: 'Leeds (HMP)',
  bookingId: 56789,
  prisonerNumber: 'A5678CS',
  firstName: 'ANDREW',
  lastName: 'BROWN',
  cellLocation: '2-4-001',
}

export const walterSmith: OffenderSearchResultIn = {
  prisonId: 'BXI',
  prisonName: 'Brixton (HMP)',
  bookingId: 56790,
  prisonerNumber: 'A5679NW',
  firstName: 'WALTER',
  lastName: 'SMITH',
  cellLocation: '2-4-002',
}

export const maxClarke: OffenderSearchResultTransfer = {
  prisonId: transferPrisonId,
  prisonName: 'Transfer',
  bookingId: 12349,
  prisonerNumber: 'C1234CC',
  firstName: 'MAX',
  lastName: 'CLARKE',
  locationDescription: 'Transfer',
}

export const joePeters: OffenderSearchResultOut = {
  prisonId: outsidePrisonId,
  prisonName: 'Outside',
  bookingId: 12348,
  prisonerNumber: 'B1234BB',
  firstName: 'JOE',
  lastName: 'PETERS',
  locationDescription: 'Outside - released from Moorland (HMP)',
}

export const nathanLost: OffenderSearchResult = {
  prisonId: undefined,
  prisonName: undefined,
  bookingId: undefined,
  prisonerNumber: 'D1234DD',
  firstName: 'NATHAN',
  lastName: 'LOST',
  cellLocation: undefined,
}

export const mockPrisoners = [davidJones, fredMills, oscarJones, andrewBrown, walterSmith, maxClarke, joePeters]

export const mockGetPrisoner: OffenderSearchClient['getPrisoner'] = prisonerNumber => {
  const result = mockPrisoners.find(prisoner => prisoner.prisonerNumber === prisonerNumber)
  if (result) {
    return Promise.resolve(result)
  }

  return Promise.reject(mockRestClientError(404))
}

export const sampleOffenderSearchResults: OffenderSearchResults = {
  content: [fredMills, oscarJones],
  totalElements: 2,
}

export function mockMovePrisoner(
  prisoner: OffenderSearchResult,
  prisonId: TransferPrisonId,
  prisonName?: string,
): OffenderSearchResultTransfer
export function mockMovePrisoner(
  prisoner: OffenderSearchResult,
  prisonId: OutsidePrisonId,
  prisonName?: string,
): OffenderSearchResultOut
export function mockMovePrisoner(
  prisoner: OffenderSearchResult,
  prisonId: string,
  prisonName?: string,
): OffenderSearchResultIn
export function mockMovePrisoner(
  prisoner: OffenderSearchResult,
  prisonId: string,
  prisonName?: string,
): OffenderSearchResult {
  if (prisonId === transferPrisonId) {
    const prisonerBeingTransferred = {
      ...prisoner,
      prisonId: transferPrisonId,
      prisonName: 'Transfer',
      locationDescription: 'Transfer',
    } satisfies OffenderSearchResultTransfer
    if ('cellLocation' in prisonerBeingTransferred) {
      delete prisonerBeingTransferred.cellLocation
    }
    return prisonerBeingTransferred
  }

  if (prisonId === outsidePrisonId) {
    const prisonerOutside = {
      ...prisoner,
      prisonId: outsidePrisonId,
      prisonName: 'Outside',
      locationDescription: `Outside - released from ${prisoner.prisonName}`,
    } satisfies OffenderSearchResultOut
    if ('cellLocation' in prisonerOutside) {
      delete prisonerOutside.cellLocation
    }
    return prisonerOutside
  }

  if (!prisonId) {
    const prisonerUnknown = {
      ...prisoner,
    }
    delete prisonerUnknown.prisonId
    delete prisonerUnknown.prisonName
    if ('cellLocation' in prisonerUnknown) {
      delete prisonerUnknown.cellLocation
    }
    if ('locationDescription' in prisonerUnknown) {
      delete prisonerUnknown.locationDescription
    }
    return prisonerUnknown
  }

  return {
    ...prisoner,
    prisonId,
    prisonName: prisonName ?? 'Some prison',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    cellLocation: prisoner.cellLocation ?? '1-1-001',
  } satisfies OffenderSearchResultIn
}
