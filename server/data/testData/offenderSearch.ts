import type { OffenderSearchClient, OffenderSearchResult, OffenderSearchResults } from '../offenderSearch'
import { SanitisedError } from '../../sanitisedError'

export const davidJones: OffenderSearchResult = {
  prisonId: 'MDI',
  prisonName: 'Moorland (HMP)',
  bookingId: 12345,
  prisonerNumber: 'A1234BC',
  firstName: 'DAVID',
  lastName: 'JONES',
  cellLocation: '1-1-001',
}

export const fredMills: OffenderSearchResult = {
  prisonId: 'MDI',
  prisonName: 'Moorland (HMP)',
  bookingId: 12346,
  prisonerNumber: 'A1235EF',
  firstName: 'FRED',
  lastName: 'MILLS',
  cellLocation: '1-1-002',
}

export const oscarJones: OffenderSearchResult = {
  prisonId: 'MDI',
  prisonName: 'Moorland (HMP)',
  bookingId: 12347,
  prisonerNumber: 'A1236CS',
  firstName: 'OSCAR',
  lastName: 'JONES',
  cellLocation: '1-1-003',
}

export const andrewBrown: OffenderSearchResult = {
  prisonId: 'MDI',
  prisonName: 'Moorland (HMP)',
  bookingId: 56789,
  prisonerNumber: 'A5678CS',
  firstName: 'ANDREW',
  lastName: 'BROWN',
  cellLocation: '1-1-004',
}

export const mockGetPrisoner: OffenderSearchClient['getPrisoner'] = prisonerNumber => {
  const error: SanitisedError = {
    name: 'Error',
    status: 404,
    message: 'Not Found',
    stack: 'Not Found',
  }
  switch (prisonerNumber) {
    case davidJones.prisonerNumber:
      return Promise.resolve(davidJones)
    case fredMills.prisonerNumber:
      return Promise.resolve(fredMills)
    case oscarJones.prisonerNumber:
      return Promise.resolve(oscarJones)
    case andrewBrown.prisonerNumber:
      return Promise.resolve(andrewBrown)
    default:
      return Promise.reject(error)
  }
}

export const sampleOffenderSearchResults: OffenderSearchResults = {
  content: [fredMills, oscarJones],
  totalElements: 2,
}
