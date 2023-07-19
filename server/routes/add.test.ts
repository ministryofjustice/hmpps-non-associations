import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { OffenderSearchClient } from '../data/offenderSearch'
import { SanitisedError } from '../sanitisedError'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/offenderSearch')

// mock "key" prisoner
const prisonerNumber = 'A1234BC'
const prisoner = {
  prisonId: 'MDI',
  bookingId: 12345,
  prisonerNumber,
  firstName: 'DAVID',
  lastName: 'JONES',
}

// mock "other" prisoner
const otherPrisonerNumber = 'A1235EF'

let app: Express
let offenderSearchClient: jest.Mocked<OffenderSearchClient>

beforeEach(() => {
  app = appWithAllRoutes({})

  offenderSearchClient = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
  offenderSearchClient.getPrisoner.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Add non-association details page', () => {
  it('should return 404 if prisoner is not found', () => {
    const error: SanitisedError = {
      name: 'Error',
      status: 404,
      message: 'Not Found',
      stack: 'Not Found',
    }
    offenderSearchClient.getPrisoner.mockRejectedValue(error)

    return request(app)
      .get(routeUrls.add(prisonerNumber, otherPrisonerNumber))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
      })
  })

  it('should render breadcrumbs', () => {
    return request(app)
      .get(routeUrls.add(prisonerNumber, otherPrisonerNumber))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Jones, David')
      })
  })
})
