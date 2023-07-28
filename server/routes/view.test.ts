import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import {
  davidJones0NonAssociations,
  davidJones1OpenNonAssociation,
  davidJones2OpenNonAssociations,
} from '../data/testData/nonAssociationsApi'
import { davidJones } from '../data/testData/offenderSearch'

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

let app: Express
let nonAssociationsApi: jest.Mocked<NonAssociationsApi>
let offenderSearchClient: jest.Mocked<OffenderSearchClient>

beforeEach(() => {
  app = appWithAllRoutes({})

  nonAssociationsApi = NonAssociationsApi.prototype as jest.Mocked<NonAssociationsApi>
  offenderSearchClient = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
  offenderSearchClient.getPrisoner.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Non-associations list page', () => {
  it('should return 404 if prisoner is not found', () => {
    const error: SanitisedError = {
      name: 'Error',
      status: 404,
      message: 'Not Found',
      stack: 'Not Found',
    }
    offenderSearchClient.getPrisoner.mockRejectedValue(error)

    return request(app)
      .get(routeUrls.view(prisonerNumber))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
        expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
      })
  })

  it('should render breadcrumbs', () => {
    nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones1OpenNonAssociation)

    return request(app)
      .get(routeUrls.view(prisonerNumber))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Jones, David')
      })
  })

  it('should list all non-associations for a prisoner', () => {
    nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones2OpenNonAssociations)

    return request(app)
      .get(routeUrls.view(prisonerNumber))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)

        // table
        expect(res.text).toContain('app-sortable-table')
        expect(res.text).toContain('Mills, Fred')
        expect(res.text).toContain('Cell and landing')
        expect(res.text).toContain('See IR 12133111')
        expect(res.text).toContain('26 July 2023')
        // no message
        expect(res.text).not.toContain('This prisoner has no open non-associations')
        expect(res.text).not.toContain('This prisoner has no closed non-associations')
      })
  })

  it('should show a message when there are no non-associations', () => {
    nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones0NonAssociations)

    return request(app)
      .get(routeUrls.view(prisonerNumber))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)

        // message
        expect(res.text).toContain('This prisoner has no open non-associations in Moorland (HMP)')
        expect(res.text).not.toContain('This prisoner has no closed non-associations')
        // no table
        expect(res.text).not.toContain('app-sortable-table')
      })
  })
})
