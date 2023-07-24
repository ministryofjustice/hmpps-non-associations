import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { OffenderSearchClient } from '../data/offenderSearch'
import { davidJones } from '../data/testData/offenderSearch'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/offenderSearch')

// mock "key" prisoner
const { prisonerNumber } = davidJones
const prisoner = davidJones

// mock non-association
const nonAssociationId = 132

let app: Express
let offenderSearchClient: jest.Mocked<OffenderSearchClient>

beforeEach(() => {
  app = appWithAllRoutes({})

  offenderSearchClient = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Close non-association page', () => {
  it('should return 404 if prisoner is not found', () => {
    const error: SanitisedError = {
      name: 'Error',
      status: 404,
      message: 'Not Found',
      stack: 'Not Found',
    }
    offenderSearchClient.getPrisoner.mockRejectedValue(error)

    return request(app)
      .get(routeUrls.close(prisonerNumber, nonAssociationId))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(offenderSearchClient.getPrisoner.mock.calls).toHaveLength(1)
      })
  })

  it('should render breadcrumbs', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)

    return request(app)
      .get(routeUrls.close(prisonerNumber, nonAssociationId))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Jones, David')
        expect(offenderSearchClient.getPrisoner.mock.calls).toHaveLength(1)
      })
  })
})
