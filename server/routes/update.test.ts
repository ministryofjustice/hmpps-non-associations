import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { OffenderSearchClient, OffenderSearchResult } from '../data/offenderSearch'
import { mockNonAssociation } from '../data/testData/nonAssociationsApi'
import { davidJones, fredMills, oscarJones } from '../data/testData/offenderSearch'
import { nameOfPerson } from '../utils/utils'

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
        expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
      })
  })

  it('should return 404 if key prisoner is not part of non-association', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)

    return request(app)
      .get(routeUrls.update(oscarJones.prisonerNumber, nonAssociation.id))
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
      })
  })

  it('should return 404 if the non-association is closed', () => {
    const closedNonAssociation = mockNonAssociation(prisoner.prisonerNumber, otherPrisoner.prisonerNumber, true)

    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(closedNonAssociation)

    return request(app)
      .get(routeUrls.update(prisonerNumber, closedNonAssociation.id))
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
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

  it('should show error messages if form has errors', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(otherPrisoner)

    return request(app)
      .post(routeUrls.update(prisonerNumber, nonAssociation.id))
      .send({
        formId: 'update',
        prisonerRole: 'VICTIM',
        otherPrisonerRole: 'PERPETRATOR',
        reason: 'THREAT',
        restrictionType: 'LANDING',
        comment: nonAssociation.comment, // Comment not updated
      })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
        expect(nonAssociationsApi.createNonAssociation).not.toHaveBeenCalled()

        expect(res.text).toContain('There is a problem')
        expect(res.text).toContain('Enter a comment to explain what you are updating')
      })
  })

  it('should show confirmation page if form had no errors', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(otherPrisoner)

    const updatedComment = `${nonAssociation.comment}\n\n - IR number: 123`
    const updatedNonAssociation = { ...nonAssociation, comment: updatedComment }
    nonAssociationsApi.updateNonAssociation.mockResolvedValueOnce(updatedNonAssociation)

    // NOTE: Updating from 2nd prisoner to check roles are still updated correctly
    return request(app)
      .post(routeUrls.update(otherPrisoner.prisonerNumber, nonAssociation.id))
      .send({
        formId: 'update',
        prisonerRole: nonAssociation.secondPrisonerRole,
        otherPrisonerRole: nonAssociation.firstPrisonerRole,
        reason: nonAssociation.reason,
        restrictionType: nonAssociation.restrictionType,
        comment: updatedComment,
      })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
        expect(nonAssociationsApi.updateNonAssociation).toHaveBeenCalledWith(nonAssociation.id, {
          firstPrisonerRole: nonAssociation.firstPrisonerRole,
          secondPrisonerRole: nonAssociation.secondPrisonerRole,
          reason: nonAssociation.reason,
          restrictionType: nonAssociation.restrictionType,
          comment: updatedComment,
        })

        expect(res.text).toContain('The non-association has been updated on each prisoner’s profile')
      })
  })

  it('should generic error page when api returns an error', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(otherPrisoner)

    const updatedComment = `${nonAssociation.comment}\n\n - IR number: 123`
    const error: SanitisedError = {
      name: 'Error',
      status: 400,
      message: 'Bad Request',
      stack: 'Error: Bad Request',
    }
    nonAssociationsApi.updateNonAssociation.mockRejectedValue(error)

    return request(app)
      .post(routeUrls.update(otherPrisoner.prisonerNumber, nonAssociation.id))
      .send({
        formId: 'update',
        prisonerRole: nonAssociation.secondPrisonerRole,
        otherPrisonerRole: nonAssociation.firstPrisonerRole,
        reason: nonAssociation.reason,
        restrictionType: nonAssociation.restrictionType,
        comment: updatedComment,
      })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
        expect(nonAssociationsApi.updateNonAssociation).toHaveBeenCalledWith(nonAssociation.id, {
          firstPrisonerRole: nonAssociation.firstPrisonerRole,
          secondPrisonerRole: nonAssociation.secondPrisonerRole,
          reason: nonAssociation.reason,
          restrictionType: nonAssociation.restrictionType,
          comment: updatedComment,
        })

        expect(res.text).not.toContain('The non-association has been updated on each prisoner’s profile')
        expect(res.text).toContain('Non-association could not be updated') // error message
        expect(res.text).toContain(updatedComment) // form still pre-filled
      })
  })
})
