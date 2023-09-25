import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes, mockUser, mockReadOnlyUser, mockUserWithGlobalSearch } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations } from '../data/constants'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import { mockNonAssociation } from '../data/testData/nonAssociationsApi'
import { davidJones, fredMills, oscarJones, maxClarke, joePeters } from '../data/testData/offenderSearch'

jest.mock('../data/nonAssociationsApi', () => {
  // ensures that constants are preserved
  type Module = typeof import('../data/nonAssociationsApi')
  const realModule = jest.requireActual<Module>('../data/nonAssociationsApi')
  const mockedModule = jest.createMockFromModule<Module>('../data/nonAssociationsApi')
  return { __esModule: true, ...realModule, NonAssociationsApi: mockedModule.NonAssociationsApi }
})
jest.mock('../data/offenderSearch', () => {
  // ensures that sort and order constants are preserved
  type Module = typeof import('../data/offenderSearch')
  const realModule = jest.requireActual<Module>('../data/offenderSearch')
  const mockedModule = jest.createMockFromModule<Module>('../data/offenderSearch')
  return { __esModule: true, ...realModule, OffenderSearchClient: mockedModule.OffenderSearchClient }
})

// mock "key" prisoner
const { prisonerNumber } = davidJones
const prisoner = davidJones

// mock non-association
const openNonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber)
const closedNonAssociation = mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, true)

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
  it.each([
    {
      scenario: 'does not have write permissions',
      user: mockReadOnlyUser,
      prisoner: davidJones,
      otherPrisoner: fredMills,
      expectEarly404: true,
    },
    {
      scenario: 'is missing global search',
      user: {
        ...mockUser,
        roles: [userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations],
      },
      prisoner: davidJones,
      otherPrisoner: maxClarke,
      expectEarly404: false,
    },
    {
      scenario: 'is missing inactive bookings role',
      user: mockUserWithGlobalSearch,
      prisoner: joePeters,
      otherPrisoner: davidJones,
      expectEarly404: false,
    },
  ])('should return 404 if user $scenario', ({ user, prisoner: p1, otherPrisoner: p2, expectEarly404 }) => {
    app = appWithAllRoutes({
      userSupplier: () => user,
    })
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(p1)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(p2)
    const na = mockNonAssociation(p1.prisonerNumber, p2.prisonerNumber)
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(na)

    return request(app)
      .get(routeUrls.close(p1.prisonerNumber, na.id))
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(() => {
        if (expectEarly404) {
          expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
          expect(nonAssociationsApi.getNonAssociation).not.toHaveBeenCalled()
        } else {
          expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
          expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        }
        expect(nonAssociationsApi.closeNonAssociation).not.toHaveBeenCalled()
      })
  })

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
        expect(nonAssociationsApi.closeNonAssociation).not.toHaveBeenCalled()
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
        expect(nonAssociationsApi.closeNonAssociation).not.toHaveBeenCalled()
      })
  })

  it('should return 404 if the non-association is closed', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(closedNonAssociation)

    return request(app)
      .get(routeUrls.close(prisonerNumber, closedNonAssociation.id))
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
        expect(nonAssociationsApi.closeNonAssociation).not.toHaveBeenCalled()
      })
  })

  it('should render breadcrumbs', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(openNonAssociation)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(fredMills)

    return request(app)
      .get(routeUrls.close(prisonerNumber, openNonAssociation.id))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Jones, David')
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
        expect(nonAssociationsApi.closeNonAssociation).not.toHaveBeenCalled()
      })
  })

  describe('should show prisoner name and number', () => {
    beforeEach(() => {
      nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(openNonAssociation)
      offenderSearchClient.getPrisoner.mockImplementation(somePrisonerNumber => {
        if (somePrisonerNumber === davidJones.prisonerNumber) {
          return Promise.resolve(davidJones)
        }
        if (somePrisonerNumber === fredMills.prisonerNumber) {
          return Promise.resolve(fredMills)
        }
        return Promise.reject(Error('test implementation error'))
      })
    })

    it('when key prisoner is the first one in the non-association', () => {
      return request(app)
        .get(routeUrls.close(davidJones.prisonerNumber, openNonAssociation.id))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)

          expect(res.text).toContain('Jones, David')
          expect(res.text).toContain('Mills, Fred')
          const startPosition = res.text.indexOf('Prisoners involved')
          const davidJonesPosition = res.text.indexOf('Jones, David', startPosition)
          const fredMillsPosition = res.text.indexOf('Mills, Fred', startPosition)
          expect(davidJonesPosition).toBeLessThan(fredMillsPosition)
        })
    })

    it('when key prisoner is the second one in the non-association', () => {
      return request(app)
        .get(routeUrls.close(fredMills.prisonerNumber, openNonAssociation.id))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)

          expect(res.text).toContain('Mills, Fred')
          expect(res.text).toContain('Jones, David')
          const startPosition = res.text.indexOf('Prisoners involved')
          const fredMillsPosition = res.text.indexOf('Mills, Fred', startPosition)
          const davidJonesPosition = res.text.indexOf('Jones, David', startPosition)
          expect(fredMillsPosition).toBeLessThan(davidJonesPosition)
        })
    })
  })

  it('should render a form before anything was submitted', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(openNonAssociation)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(fredMills)

    return request(app)
      .get(routeUrls.close(prisonerNumber, openNonAssociation.id))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
        expect(nonAssociationsApi.closeNonAssociation).not.toHaveBeenCalled()

        expect(res.text).not.toContain('There is a problem')
        expect(res.text).toContain('Jones, David – A1234BC')
        expect(res.text).toContain('Explain why this non-association is no longer required')

        expect(res.text).toContain(`/prisoner/${prisoner.prisonerNumber}/non-associations/${openNonAssociation.id}`)
      })
  })

  it('should show error messages if form has errors', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(openNonAssociation)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(fredMills)

    return request(app)
      .post(routeUrls.close(prisonerNumber, openNonAssociation.id))
      .send({
        formId: 'close',
        closedReason: '',
      })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
        expect(nonAssociationsApi.closeNonAssociation).not.toHaveBeenCalled()

        expect(res.text).toContain('There is a problem')
        expect(res.text).toContain('Jones, David – A1234BC')
        expect(res.text).toContain('Enter a comment')
      })
  })

  it('should show confirmation page if form had no errors', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(openNonAssociation)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(fredMills)
    nonAssociationsApi.closeNonAssociation.mockResolvedValueOnce(closedNonAssociation)

    return request(app)
      .post(routeUrls.close(prisonerNumber, openNonAssociation.id))
      .send({
        formId: 'close',
        closedReason: 'Problem resolved through mediation',
      })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
        expect(nonAssociationsApi.closeNonAssociation).toHaveBeenCalledTimes(1)
        expect(nonAssociationsApi.closeNonAssociation).toHaveBeenCalledWith(openNonAssociation.id, {
          closedReason: 'Problem resolved through mediation',
        })

        expect(res.text).toContain('The non-association has been closed')
        expect(res.text).not.toContain('There is a problem')
        expect(res.text).not.toContain('Jones, David – A1234BC')
        expect(res.text).not.toContain('Enter a comment')
      })
  })

  it('should generic error page when api returns an error', () => {
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(openNonAssociation)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(fredMills)
    const error: SanitisedError = {
      name: 'Error',
      status: 400,
      message: 'Bad Request',
      stack: 'Error: Bad Request',
    }
    nonAssociationsApi.closeNonAssociation.mockRejectedValueOnce(error)

    return request(app)
      .post(routeUrls.close(prisonerNumber, openNonAssociation.id))
      .send({
        formId: 'close',
        closedReason: 'Problem resolved through mediation',
      })
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
        expect(nonAssociationsApi.closeNonAssociation).toHaveBeenCalledTimes(1)

        expect(res.text).toContain('Non-association could not be closed') // error message
        expect(res.text).not.toContain('The non-association has been closed')
        expect(res.text).not.toContain('There is a problem')
        expect(res.text).not.toContain('Enter a comment')
        expect(res.text).toContain('Jones, David – A1234BC')
        expect(res.text).toContain('Problem resolved through mediation') // form still pre-filled
      })
  })
})
