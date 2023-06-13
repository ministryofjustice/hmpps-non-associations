import type { UserCaseloads } from '../nomisUserRolesApi'

export function getSingleCaseload(): UserCaseloads {
  return {
    activeCaseload: { id: 'MDI', name: 'Moorland' },
    caseloads: [{ id: 'MDI', name: 'Moorland' }],
  }
}

export function getMultipleCaseloads(): UserCaseloads {
  return {
    activeCaseload: { id: 'LEI', name: 'Leeds' },
    caseloads: [
      { id: 'MDI', name: 'Moorland' },
      { id: 'LEI', name: 'Leeds' },
    ],
  }
}
