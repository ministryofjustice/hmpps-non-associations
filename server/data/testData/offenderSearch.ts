import type { OffenderSearchResult, OffenderSearchResults } from '../offenderSearch'

export const davidJones: OffenderSearchResult = {
  prisonId: 'MDI',
  bookingId: 12345,
  prisonerNumber: 'A1234BC',
  firstName: 'DAVID',
  lastName: 'JONES',
  cellLocation: '1-1-001',
}

export const fredMills: OffenderSearchResult = {
  prisonId: 'MDI',
  bookingId: 12346,
  prisonerNumber: 'A1235EF',
  firstName: 'FRED',
  lastName: 'MILLS',
  cellLocation: '1-1-002',
}

export const oscarJones: OffenderSearchResult = {
  prisonId: 'MDI',
  bookingId: 12347,
  prisonerNumber: 'A1236CS',
  firstName: 'OSCAR',
  lastName: 'JONES',
  cellLocation: '1-1-003',
}

export const sampleOffenderSearchResults: OffenderSearchResults = {
  content: [fredMills, oscarJones],
  totalElements: 2,
}
