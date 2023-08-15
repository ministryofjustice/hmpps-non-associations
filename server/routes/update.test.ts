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
jest.mock('../data/nonAssociationsApi')
jest.mock('../data/offenderSearch')

// mock "key" prisoner
const { prisonerNumber } = davidJones

// mock non-association
const nonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber)
const nonAssociationId = nonAssociation.id

let app: Express
let offenderSearchClient: jest.Mocked<OffenderSearchClient>
let nonAssociationApi: jest.Mocked<NonAssociationsApi>

beforeEach(() => {
  app = appWithAllRoutes({})

  offenderSearchClient = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
  nonAssociationApi = NonAssociationsApi.prototype as jest.Mocked<NonAssociationsApi>
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Update non-association page', () => {
  it('should return 404 if prisoner is not found', () => {
    const error: SanitisedError = {
      name: 'Error',
      status: 404,
      message: 'Not Found',
      stack: 'Not Found',
    }
    offenderSearchClient.getPrisoner.mockRejectedValue(error)
    nonAssociationApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)

    return request(app)
      .get(routeUrls.update(prisonerNumber, nonAssociationId))
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
    nonAssociationApi.getNonAssociation.mockRejectedValue(error)

    return request(app)
      .get(routeUrls.update(prisonerNumber, nonAssociationId))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(nonAssociationApi.getNonAssociation).toHaveBeenCalledTimes(1)
      })
  })

  it('should render breadcrumbs', () => {
    nonAssociationApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)
    // eslint-disable-next-line @typescript-eslint/no-shadow
    offenderSearchClient.getPrisoner.mockImplementation(prisonerNumber => {
      if (prisonerNumber === davidJones.prisonerNumber) {
        return Promise.resolve(davidJones)
      }
      return Promise.resolve(fredMills)
    })

    return request(app)
      .get(routeUrls.update(prisonerNumber, nonAssociationId))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Jones, David')
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
      })
  })
})
