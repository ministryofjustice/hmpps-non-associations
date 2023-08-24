import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import { mockNonAssociation } from '../data/testData/nonAssociationsApi'
import { davidJones, fredMills, mockGetPrisoner } from '../data/testData/offenderSearch'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/nonAssociationsApi', () => {
  // ensures that constants are preserved
  type Module = typeof import('../data/nonAssociationsApi')
  const realModule = jest.requireActual<Module>('../data/nonAssociationsApi')
  const mockedModule = jest.createMockFromModule<Module>('../data/nonAssociationsApi')
  return { __esModule: true, ...realModule, NonAssociationsApi: mockedModule.NonAssociationsApi }
})
jest.mock('../data/offenderSearch')

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
let offenderSearchClient: jest.Mocked<OffenderSearchClient>
let nonAssociationsApi: jest.Mocked<NonAssociationsApi>

beforeEach(() => {
  app = appWithAllRoutes({})

  offenderSearchClient = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
  nonAssociationsApi = NonAssociationsApi.prototype as jest.Mocked<NonAssociationsApi>
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
      })
  })

  it('should return 404 if key prisoner is not part of non-association', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)

    return request(app)
      .get(routeUrls.view('B4321BB', nonAssociation.id))
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(res.text).not.toContain('Jones, David')
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
      })
  })

  describe('details', () => {
    beforeEach(() => {
      offenderSearchClient.getPrisoner.mockImplementation(mockGetPrisoner)
    })

    function expectCommonDetails(res: request.Response) {
      expect(res.text).toContain('Threat')
      expect(res.text).toContain('Cell only')
      expect(res.text).toContain('See IR 12133100')
      expect(res.text).toContain('21 July 2023')
      expect(res.text).toContain('cde87s')
    }

    function expectOpen(res: request.Response) {
      expect(res.text).not.toContain('Closed')
      expect(res.text).toContain(`non-associations/${nonAssociationId}/update`)
      expect(res.text).toContain(`non-associations/${nonAssociationId}/close`)
    }

    function expectClosed(res: request.Response) {
      expect(res.text).toContain('Closed')
      expect(res.text).not.toContain(`non-associations/${nonAssociationId}/update`)
      expect(res.text).not.toContain(`non-associations/${nonAssociationId}/close`)
    }

    function expectDavidJonesFirst(res: request.Response) {
      expect(res.text).toContain('Fred Mills’ role')
      expect(res.text).not.toContain('David Jones’ role')
      const perpetratorPosition = res.text.indexOf('Perpetrator')
      const victimPosition = res.text.indexOf('Victim')
      expect(perpetratorPosition).toBeLessThan(victimPosition)
    }

    function expectFredMillsFirst(res: request.Response) {
      expect(res.text).toContain('David Jones’ role')
      expect(res.text).not.toContain('Fred Mills’ role')
      const perpetratorPosition = res.text.indexOf('Perpetrator')
      const victimPosition = res.text.indexOf('Victim')
      expect(perpetratorPosition).toBeGreaterThan(victimPosition)
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
        const closedNonAssociation = mockNonAssociation(prisoner.prisonerNumber, otherPrisoner.prisonerNumber, false)
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
})
