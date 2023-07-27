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
  type module = typeof import('../data/nonAssociationsApi')
  const realModule = jest.requireActual<module>('../data/nonAssociationsApi')
  const mockedModule = jest.createMockFromModule<module>('../data/nonAssociationsApi')
  return { __esModule: true, ...realModule, NonAssociationsApi: mockedModule.NonAssociationsApi }
})
jest.mock('../data/offenderSearch')

// mock "key" prisoner
const { prisonerNumber } = davidJones
const prisoner = davidJones

// mock "other" prisoner
const { prisonerNumber: otherPrisonerNumber } = fredMills
const otherPrisoner = fredMills

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
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
      })
  })

  it('should return 404 if other prisoner is not found', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    const error: SanitisedError = {
      name: 'Error',
      status: 404,
      message: 'Not Found',
      stack: 'Not Found',
    }
    offenderSearchClient.getPrisoner.mockRejectedValueOnce(error)

    return request(app)
      .get(routeUrls.add(prisonerNumber, otherPrisonerNumber))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
      })
  })

  it('should return 404 if both prisoners are the same person', () => {
    return request(app)
      .get(routeUrls.add(prisonerNumber, prisonerNumber))
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(() => {
        expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
      })
  })

  it('should render breadcrumbs', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(otherPrisoner)

    return request(app)
      .get(routeUrls.add(prisonerNumber, otherPrisonerNumber))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Jones, David')
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
      })
  })

  it('should render a form before anything was submitted', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(otherPrisoner)

    return request(app)
      .get(routeUrls.add(prisonerNumber, otherPrisonerNumber))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
        expect(nonAssociationsApi.createNonAssociation).not.toHaveBeenCalled()

        expect(res.text).not.toContain('There is a problem')
        expect(res.text).toContain('Is David Jones a victim or perpetrator?')
        expect(res.text).toContain('Is Fred Mills a victim or perpetrator?')
      })
  })

  it('should show error messages if form has errors', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(otherPrisoner)

    return request(app)
      .post(routeUrls.add(prisonerNumber, otherPrisonerNumber))
      .send({
        formId: 'add',
        prisonerRole: 'VICTIM',
        reason: 'THREAT',
        restrictionType: 'LANDING',
        comment: '',
      })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
        expect(nonAssociationsApi.createNonAssociation).not.toHaveBeenCalled()

        expect(res.text).toContain('There is a problem')
        expect(res.text).not.toContain('Select David Jones’ role in the situation')
        expect(res.text).toContain('Select Fred Mills’ role in the situation')
        expect(res.text).toContain('Enter a comment')
      })
  })

  it('should show confirmation page if form had no errors', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(otherPrisoner)
    nonAssociationsApi.createNonAssociation.mockResolvedValueOnce(
      mockNonAssociation(prisonerNumber, otherPrisonerNumber),
    )

    return request(app)
      .post(routeUrls.add(prisonerNumber, otherPrisonerNumber))
      .send({
        formId: 'add',
        prisonerRole: 'VICTIM',
        otherPrisonerRole: 'PERPETRATOR',
        reason: 'THREAT',
        restrictionType: 'LANDING',
        comment: 'An incident occurred yesterday',
      })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
        expect(nonAssociationsApi.createNonAssociation).toHaveBeenCalledTimes(1)
        expect(nonAssociationsApi.createNonAssociation).toHaveBeenCalledWith({
          firstPrisonerNumber: 'A1234BC',
          firstPrisonerRole: 'VICTIM',
          secondPrisonerNumber: 'A1235EF',
          secondPrisonerRole: 'PERPETRATOR',
          reason: 'THREAT',
          restrictionType: 'LANDING',
          comment: 'An incident occurred yesterday',
        })

        expect(res.text).toContain('The non-association has been added to each prisoner’s profile')
      })
  })
})
