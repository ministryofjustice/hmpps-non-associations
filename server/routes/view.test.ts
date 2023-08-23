import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import { mockNonAssociation } from '../data/testData/nonAssociationsApi'
import { davidJones, fredMills } from '../data/testData/offenderSearch'

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
})
