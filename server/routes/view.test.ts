import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes, mockUser, mockReadOnlyUser, mockUserWithGlobalSearch } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations } from '../data/constants'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import PrisonApi from '../data/prisonApi'
import { mockNonAssociation } from '../data/testData/nonAssociationsApi'
import {
  davidJones,
  fredMills,
  oscarJones,
  andrewBrown,
  maxClarke,
  joePeters,
  mockGetPrisoner,
} from '../data/testData/offenderSearch'
import { mockGetStaffDetails } from '../data/testData/prisonApi'

jest.mock('@ministryofjustice/hmpps-non-associations-api', () => {
  // ensures that constants are preserved
  type Module = typeof import('@ministryofjustice/hmpps-non-associations-api')
  const realModule = jest.requireActual<Module>('@ministryofjustice/hmpps-non-associations-api')
  const mockedModule = jest.createMockFromModule<Module>('@ministryofjustice/hmpps-non-associations-api')
  return { __esModule: true, ...realModule, NonAssociationsApi: mockedModule.NonAssociationsApi }
})
jest.mock('../data/offenderSearch', () => {
  // ensures that constants and functions are preserved
  type Module = typeof import('../data/offenderSearch')
  const realModule = jest.requireActual<Module>('../data/offenderSearch')
  const mockedModule = jest.createMockFromModule<Module>('../data/offenderSearch')
  return { __esModule: true, ...realModule, OffenderSearchClient: mockedModule.OffenderSearchClient }
})
jest.mock('../data/prisonApi')

// mock "key" prisoner
const { prisonerNumber } = davidJones
const prisoner = davidJones

// mock "other" prisoner
const { prisonerNumber: otherPrisonerNumber } = fredMills
const otherPrisoner = fredMills

// mock non-association
const nonAssociation = mockNonAssociation(prisoner.prisonerNumber, otherPrisoner.prisonerNumber)
const nonAssociationId = nonAssociation.id

let app: Express
let nonAssociationsApi: jest.Mocked<NonAssociationsApi>
let offenderSearchClient: jest.Mocked<OffenderSearchClient>
let prisonApi: jest.Mocked<PrisonApi>

beforeEach(() => {
  app = appWithAllRoutes({})

  nonAssociationsApi = NonAssociationsApi.prototype as jest.Mocked<NonAssociationsApi>
  offenderSearchClient = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
  prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('View non-association details page', () => {
  it('should return 404 if prisoner is not found', () => {
    const error: SanitisedError = {
      name: 'Error',
      status: 404,
      message: 'Not Found',
      stack: 'Not Found',
    }
    offenderSearchClient.getPrisoner.mockRejectedValue(error)
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)

    return request(app)
      .get(routeUrls.view(prisonerNumber, nonAssociationId))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
        expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()
      })
  })

  it('should return 404 if the non-association is not found', () => {
    const error: SanitisedError = {
      name: 'Error',
      status: 404,
      message: 'Not Found',
      stack: 'Not Found',
    }
    nonAssociationsApi.getNonAssociation.mockRejectedValue(error)

    return request(app)
      .get(routeUrls.view(prisonerNumber, nonAssociationId))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
        expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()
      })
  })

  it('should return 404 if key prisoner is not part of non-association', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)

    return request(app)
      .get(routeUrls.view(oscarJones.prisonerNumber, nonAssociation.id))
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
        expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()
      })
  })

  describe('details', () => {
    beforeEach(() => {
      offenderSearchClient.getPrisoner.mockImplementation(mockGetPrisoner)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
    })

    function expectCommonDetails(res: request.Response): void {
      expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledWith(nonAssociation.id)
      expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
      expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('cde87s')

      expect(res.text).toContain('Jones, David')

      expect(res.text).toContain('Photo of David Jones')
      expect(res.text).not.toContain('Photo of David Jones is not available')
      expect(res.text).toContain('href="http://dps.local/prisoner/A1234BC"')
      expect(res.text).toContain('Photo of Fred Mills')
      expect(res.text).not.toContain('Photo of Fred Mills is not available')
      expect(res.text).toContain('href="http://dps.local/prisoner/A1235EF"')

      expect(res.text).toContain('Threat')
      expect(res.text).toContain('Cell only')

      // when added
      expect(res.text).toContain('Date added')
      expect(res.text).toContain('21 July 2023')
    }

    function expectOpen(res: request.Response): void {
      // comments
      expect(res.text).toContain('See IR 12133100')

      // when updated
      expect(res.text).toContain('Last updated')
      expect(res.text).not.toContain('cde87s')
      expect(res.text).toContain('Mark Simmons')

      // buttons
      expect(res.text).toContain(`non-associations/${nonAssociationId}/update`)
      expect(res.text).toContain(`non-associations/${nonAssociationId}/close`)

      // help with roles
      expect(res.text).not.toContain('Need to update non-associations?')
    }

    function expectClosed(res: request.Response): void {
      // comments
      expect(res.text).not.toContain('See IR 12133100')
      expect(res.text).toContain('Problem solved')

      // when closed
      expect(res.text).not.toContain('Last updated')
      expect(res.text).toContain('Date closed')
      expect(res.text).toContain('26 July 2023')
      expect(res.text).not.toContain('abc12a')
      expect(res.text).toContain('Mary Johnson')
      expect(res.text).not.toContain('Mark Simmons')

      // buttons
      expect(res.text).not.toContain(`non-associations/${nonAssociationId}/update`)
      expect(res.text).not.toContain(`non-associations/${nonAssociationId}/close`)

      // help with roles
      expect(res.text).not.toContain('Need to update non-associations?')
    }

    function expectDavidJonesFirst(res: request.Response): void {
      expect(res.text).toContain('Fred Mills’ role')
      expect(res.text).not.toContain('David Jones’ role')
      const perpetratorPosition = res.text.indexOf('Perpetrator')
      const victimPosition = res.text.indexOf('Victim')
      expect(perpetratorPosition).toBeLessThan(victimPosition)
      expect(res.text.indexOf('1-1-001')).toBeLessThan(res.text.indexOf('1-1-002'))
    }

    function expectFredMillsFirst(res: request.Response): void {
      expect(res.text).toContain('David Jones’ role')
      expect(res.text).not.toContain('Fred Mills’ role')
      const perpetratorPosition = res.text.indexOf('Perpetrator')
      const victimPosition = res.text.indexOf('Victim')
      expect(perpetratorPosition).toBeGreaterThan(victimPosition)
      expect(res.text.indexOf('1-1-002')).toBeLessThan(res.text.indexOf('1-1-001'))
    }

    describe('of open non-association', () => {
      beforeEach(() => {
        nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)
      })

      it('should show', () => {
        return request(app)
          .get(routeUrls.view(prisonerNumber, nonAssociation.id))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expectCommonDetails(res)
            expectOpen(res)
            expectDavidJonesFirst(res)
          })
      })

      it('should show when viewing from other prisoner’s side', () => {
        return request(app)
          .get(routeUrls.view(otherPrisonerNumber, nonAssociation.id))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expectCommonDetails(res)
            expectOpen(res)
            expectFredMillsFirst(res)
          })
      })
    })

    describe('of closed non-association', () => {
      beforeEach(() => {
        const closedNonAssociation = mockNonAssociation(prisoner.prisonerNumber, otherPrisoner.prisonerNumber, true)
        nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(closedNonAssociation)
      })

      it('should show', () => {
        return request(app)
          .get(routeUrls.view(prisonerNumber, nonAssociation.id))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expectCommonDetails(res)
            expectClosed(res)
            expectDavidJonesFirst(res)
          })
      })

      it('should show when viewing from other prisoner’s side', () => {
        return request(app)
          .get(routeUrls.view(otherPrisonerNumber, nonAssociation.id))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expectCommonDetails(res)
            expectClosed(res)
            expectFredMillsFirst(res)
          })
      })
    })
  })

  describe('location', () => {
    beforeEach(() => {
      offenderSearchClient.getPrisoner.mockImplementation(mockGetPrisoner)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
    })

    describe('of key prisoner', () => {
      describe.each([
        {
          scenario: 'being transferred',
          key: maxClarke.prisonerNumber,
          other: davidJones.prisonerNumber,
          expectedLocation: 'Transfer',
        },
        {
          scenario: 'outside prison',
          key: joePeters.prisonerNumber,
          other: davidJones.prisonerNumber,
          expectedLocation: 'Outside - released from Moorland (HMP)',
        },
      ])('should show if they are $scenario', ({ key, other, expectedLocation }) => {
        function expectCorrectLocation() {
          return request(app)
            .get(routeUrls.view(key, nonAssociation.id))
            .expect(200)
            .expect('Content-Type', /html/)
            .expect(res => {
              expect(res.text).toContain(expectedLocation)
              expect(res.text).toContain(davidJones.cellLocation)
              expect(res.text.indexOf(expectedLocation)).toBeLessThan(res.text.indexOf(davidJones.cellLocation))
            })
        }

        it('when viewing a open non-association', () => {
          nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(mockNonAssociation(key, other))
          return expectCorrectLocation()
        })

        it('when viewing a closed non-association', () => {
          nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(mockNonAssociation(key, other, true))
          return expectCorrectLocation()
        })
      })
    })

    describe('of other prisoner', () => {
      describe.each([
        {
          scenario: 'being transferred',
          key: davidJones.prisonerNumber,
          other: maxClarke.prisonerNumber,
          expectedLocation: 'Transfer',
        },
        {
          scenario: 'outside prison',
          key: davidJones.prisonerNumber,
          other: joePeters.prisonerNumber,
          expectedLocation: 'Outside - released from Moorland (HMP)',
        },
      ])('should show if they are $scenario', ({ key, other, expectedLocation }) => {
        function expectCorrectLocation() {
          return request(app)
            .get(routeUrls.view(key, nonAssociation.id))
            .expect(200)
            .expect('Content-Type', /html/)
            .expect(res => {
              expect(res.text).toContain(expectedLocation)
              expect(res.text).toContain(davidJones.cellLocation)
              expect(res.text.indexOf(expectedLocation)).toBeGreaterThan(res.text.indexOf(davidJones.cellLocation))
            })
        }

        it('when viewing a open non-association', () => {
          nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(mockNonAssociation(key, other))
          return expectCorrectLocation()
        })

        it('when viewing a closed non-association', () => {
          nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(mockNonAssociation(key, other, true))
          return expectCorrectLocation()
        })
      })
    })
  })

  it.each([
    {
      scenario: 'key',
      prisonerNumber: andrewBrown.prisonerNumber,
      otherPrisonerNumber: davidJones.prisonerNumber,
    },
    {
      scenario: 'other',
      prisonerNumber: davidJones.prisonerNumber,
      otherPrisonerNumber: andrewBrown.prisonerNumber,
    },
  ])(
    'should not show link to $scenario prisoner profile when the user does not have permission',
    ({ prisonerNumber: p1, otherPrisonerNumber: p2 }) => {
      const na = mockNonAssociation(p1, p2)
      offenderSearchClient.getPrisoner.mockImplementation(mockGetPrisoner)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
      nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(na)

      return request(app)
        .get(routeUrls.view(p1, na.id))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('Photo of David Jones is not available')
          expect(res.text).toContain('Photo of Andrew Brown is not available')
        })
    },
  )

  describe('should hide update and close buttons when', () => {
    it.each([
      {
        scenario: 'you have no write permissions',
        user: mockReadOnlyUser,
        nonAssociation,
      },
      {
        scenario:
          'a prisoner is being transferred but you do not have global search whilst the other is not in your caseloads',
        user: {
          ...mockUser,
          roles: [userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations],
        },
        nonAssociation: mockNonAssociation(andrewBrown.prisonerNumber, maxClarke.prisonerNumber),
      },
      {
        scenario:
          'a person is not in an establishment but you do not have inactive bookings role whilst the other is not in your caseloads',
        user: mockUserWithGlobalSearch,
        nonAssociation: mockNonAssociation(joePeters.prisonerNumber, andrewBrown.prisonerNumber),
      },
    ])('$scenario', ({ user, nonAssociation: na }) => {
      app = appWithAllRoutes({
        userSupplier: () => user,
      })
      offenderSearchClient.getPrisoner.mockImplementation(mockGetPrisoner)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)
      nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(na)

      return request(app)
        .get(routeUrls.view(na.firstPrisonerNumber, na.id))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          // buttons
          expect(res.text).not.toContain(`non-associations/${nonAssociationId}/update`)
          expect(res.text).not.toContain(`non-associations/${nonAssociationId}/close`)

          // help with roles
          expect(res.text).toContain('Need to update non-associations?')
        })
    })
  })

  it('should display “System” instead of internal system username as the authoriser', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce({
      ...nonAssociation,
      authorisedBy: 'NON_ASSOCIATIONS_API',
      updatedBy: 'NON_ASSOCIATIONS_API',
    })
    offenderSearchClient.getPrisoner.mockImplementation(mockGetPrisoner)
    prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

    return request(app)
      .get(routeUrls.view(otherPrisonerNumber, nonAssociation.id))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('System')
        expect(res.text).not.toContain('NON_ASSOCIATIONS_API')
      })
  })

  it('should show authoriser username when prison api returned an error', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)
    offenderSearchClient.getPrisoner.mockImplementation(mockGetPrisoner)
    const error: SanitisedError = {
      name: 'Error',
      status: 500,
      message: 'Internal Server Error',
      stack: 'Internal Server Error',
    }
    prisonApi.getStaffDetails.mockRejectedValueOnce(error)

    return request(app)
      .get(routeUrls.view(otherPrisonerNumber, nonAssociation.id))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('cde87s')
        expect(res.text).not.toContain('Mark Simmons')
      })
  })
})
