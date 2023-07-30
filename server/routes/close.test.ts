import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { OffenderSearchClient } from '../data/offenderSearch'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { mockNonAssociation } from '../data/testData/nonAssociationsApi'
import { davidJones, fredMills, oscarJones } from '../data/testData/offenderSearch'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/nonAssociationsApi')
jest.mock('../data/offenderSearch')

// mock "key" prisoner
const { prisonerNumber } = davidJones
const prisoner = davidJones

// mock non-association
const openNonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber)

let app: Express
let nonAssociationsApi: jest.Mocked<NonAssociationsApi>
let offenderSearchClient: jest.Mocked<OffenderSearchClient>

beforeEach(() => {
  app = appWithAllRoutes({})

  nonAssociationsApi = NonAssociationsApi.prototype as jest.Mocked<NonAssociationsApi>
  offenderSearchClient = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Close non-association page', () => {
  it('should return 404 if non-association is not found', () => {
    const error: SanitisedError = {
      name: 'Error',
      status: 404,
      message: 'Not Found',
      stack: 'Not Found',
    }
    nonAssociationsApi.getNonAssociation.mockRejectedValue(error)

    return request(app)
      .get(routeUrls.close(prisonerNumber, openNonAssociation.id))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
      })
  })

  it('should return 404 if key prisoner is not part of non-association', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(openNonAssociation)

    return request(app)
      .get(routeUrls.close(oscarJones.prisonerNumber, openNonAssociation.id))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, Oscar')
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
      })
  })

  it('should render breadcrumbs', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(openNonAssociation)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)

    return request(app)
      .get(routeUrls.close(prisonerNumber, openNonAssociation.id))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Jones, David')
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
      })
  })
})
