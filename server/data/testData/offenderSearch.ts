import type {
  OffenderSearchClient,
  OffenderSearchResultIn,
  OffenderSearchResultOut,
  OffenderSearchResultTransfer,
  OffenderSearchResults,
} from '../offenderSearch'
import { SanitisedError } from '../../sanitisedError'

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
  prisonId: 'MDI',
  prisonName: 'Moorland (HMP)',
  bookingId: 56789,
  prisonerNumber: 'A5678CS',
  firstName: 'ANDREW',
  lastName: 'BROWN',
  cellLocation: '1-1-004',
}

export const maxClarke: OffenderSearchResultTransfer = {
  prisonId: 'TRN',
  prisonName: 'Transfer',
  bookingId: 12349,
  prisonerNumber: 'C1234CC',
  firstName: 'MAX',
  lastName: 'CLARKE',
  locationDescription: 'Transfer',
}

export const joePeters: OffenderSearchResultOut = {
  prisonId: 'OUT',
  prisonName: 'Outside',
  bookingId: 12348,
  prisonerNumber: 'B1234BB',
  firstName: 'JOE',
  lastName: 'PETERS',
  locationDescription: 'Outside - released from Moorland (HMP)',
}

export const mockPrisoners = [davidJones, fredMills, oscarJones, andrewBrown, maxClarke, joePeters]

export const mockGetPrisoner: OffenderSearchClient['getPrisoner'] = prisonerNumber => {
  const result = mockPrisoners.find(prisoner => prisoner.prisonerNumber === prisonerNumber)
  if (result) {
    return Promise.resolve(result)
  }

  const error: SanitisedError = {
    name: 'Error',
    status: 404,
    message: 'Not Found',
    stack: 'Not Found',
  }
  return Promise.reject(error)
}

export const sampleOffenderSearchResults: OffenderSearchResults = {
  content: [fredMills, oscarJones],
  totalElements: 2,
}
