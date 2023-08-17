import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { OffenderSearchClient, OffenderSearchResult } from '../data/offenderSearch'
import { mockNonAssociation } from '../data/testData/nonAssociationsApi'
import { davidJones, fredMills } from '../data/testData/offenderSearch'
import { nameOfPerson } from '../utils/utils'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/nonAssociationsApi')
jest.mock('../data/offenderSearch')

// mock "key" prisoner
const { prisonerNumber } = davidJones
const prisoner = davidJones

// mock "other" prisoner
const otherPrisoner = fredMills

// mock non-association
const nonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber)
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

describe('Update non-association page', () => {
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
    nonAssociationsApi.getNonAssociation.mockRejectedValue(error)

    return request(app)
      .get(routeUrls.update(prisonerNumber, nonAssociationId))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
      })
  })

  it('should render breadcrumbs', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(otherPrisoner)

    return request(app)
      .get(routeUrls.update(prisonerNumber, nonAssociationId))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Jones, David')
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
      })
  })

  describe('rendering a form before anything was submitted', () => {
    describe.each([
      ['via 1st prisoner', [prisoner, otherPrisoner]],
      ['via 2nd prisoner', [otherPrisoner, prisoner]],
    ])('when opening form %s', (scenario: string, prisonersOrder: Array<OffenderSearchResult>) => {
      it('loads data in correct order', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const [prisoner, otherPrisoner] = prisonersOrder
        nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)

        // eslint-disable-next-line @typescript-eslint/no-shadow
        offenderSearchClient.getPrisoner.mockImplementation(prisonerNumber => {
          if (prisonerNumber === davidJones.prisonerNumber) {
            return Promise.resolve(davidJones)
          }
          return Promise.resolve(fredMills)
        })

        return request(app)
          .get(routeUrls.update(prisoner.prisonerNumber, nonAssociation.id))
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
            expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
            expect(nonAssociationsApi.updateNonAssociation).not.toHaveBeenCalled()

            expect(res.text).not.toContain('There is a problem')
            expect(res.text).toContain(nonAssociation.comment)

            // Check names are shown in correct order (key prisoner first)
            const roles = res.text.match(/Is (.+) a victim or perpetrator\?/g)
            expect(roles).toEqual([
              `Is ${nameOfPerson(prisoner)} a victim or perpetrator?`,
              `Is ${nameOfPerson(otherPrisoner)} a victim or perpetrator?`,
            ])
          })
      })
    })
  })
})
