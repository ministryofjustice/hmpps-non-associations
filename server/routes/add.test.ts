import { type ErrorResponse, ErrorCode } from '@ministryofjustice/hmpps-non-associations-api'
import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes, mockUser, mockReadOnlyUser, mockUserWithGlobalSearch } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations } from '../data/constants'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import { mockNonAssociation } from '../data/testData/nonAssociationsApi'
import { davidJones, fredMills, maxClarke, joePeters, mockGetPrisoner } from '../data/testData/offenderSearch'

jest.mock('@ministryofjustice/hmpps-non-associations-api', () => {
  // ensures that constants are preserved
  type Module = typeof import('@ministryofjustice/hmpps-non-associations-api')
  const realModule = jest.requireActual<Module>('@ministryofjustice/hmpps-non-associations-api')
  const mockedModule = jest.createMockFromModule<Module>('@ministryofjustice/hmpps-non-associations-api')
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
  it.each([
    {
      scenario: 'does not have write permissions',
      user: mockReadOnlyUser,
      prisoner: davidJones,
      otherPrisoner: fredMills,
    },
    {
      scenario: 'is missing global search',
      user: {
        ...mockUser,
        roles: [userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations],
      },
      prisoner: davidJones,
      otherPrisoner: maxClarke,
    },
    {
      scenario: 'is missing inactive bookings role',
      user: mockUserWithGlobalSearch,
      prisoner: joePeters,
      otherPrisoner: davidJones,
    },
  ])('should return 404 if user $scenario', ({ user, prisoner: p1, otherPrisoner: p2 }) => {
    app = appWithAllRoutes({
      userSupplier: () => user,
    })
    offenderSearchClient.getPrisoner.mockImplementation(mockGetPrisoner)

    return request(app)
      .get(routeUrls.add(p1.prisonerNumber, p2.prisonerNumber))
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain(p1.firstName)
        expect(res.text).not.toContain(p1.lastName)
        expect(res.text).not.toContain(p2.firstName)
        expect(res.text).not.toContain(p2.lastName)
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
        expect(nonAssociationsApi.createNonAssociation).not.toHaveBeenCalled()
      })
  })

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
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(2)
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
    offenderSearchClient.getPrisoner.mockImplementation(mockGetPrisoner)

    return request(app)
      .get(routeUrls.add(prisonerNumber, prisonerNumber))
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(() => {
        expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
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
        const davidJonesPosition = res.text.indexOf('Is David Jones a victim or perpetrator?')
        const fredMillsPosition = res.text.indexOf('Is Fred Mills a victim or perpetrator?')
        expect(davidJonesPosition).toBeLessThan(fredMillsPosition)
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

  it('should an error when api indicates there is an open non-association already', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(otherPrisoner)
    const error: SanitisedError<ErrorResponse> = {
      name: 'Error',
      status: 409,
      message: 'Bad Request',
      stack: 'Error: Bad Request',
      data: {
        status: 409,
        errorCode: ErrorCode.OpenNonAssociationAlreadyExist,
        userMessage: `Non-association already exists for these prisoners that is open: Prisoners [${prisonerNumber}, ${otherPrisonerNumber}] already have open non-associations`,
        developerMessage: `Prisoners [${prisonerNumber}, ${otherPrisonerNumber}] already have open non-associations`,
        moreInfo: null,
      },
    }
    nonAssociationsApi.createNonAssociation.mockRejectedValue(error)
    const openNonassociation = mockNonAssociation(prisonerNumber, otherPrisonerNumber)
    openNonassociation.id = 1231
    nonAssociationsApi.listNonAssociationsBetween.mockResolvedValueOnce([openNonassociation])

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
        expect(nonAssociationsApi.listNonAssociationsBetween).toHaveBeenCalledTimes(1)
        expect(nonAssociationsApi.listNonAssociationsBetween).toHaveBeenCalledWith([
          prisonerNumber,
          otherPrisonerNumber,
        ])

        expect(res.text).not.toContain('The non-association has been added to each prisoner’s profile')
        expect(res.text).toContain('There is already an open non-association between these 2 prisoners') // error message
        expect(res.text).toContain('View the existing non-association') // error message
        expect(res.text).toContain(`/prisoner/${prisonerNumber}/non-associations/${openNonassociation.id}`) // link to open
        expect(res.text).toContain('An incident occurred yesterday') // form still pre-filled
      })
  })

  it('should an error when api returns a generic error', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(otherPrisoner)
    const error: SanitisedError = {
      name: 'Error',
      status: 400,
      message: 'Bad Request',
      stack: 'Error: Bad Request',
    }
    nonAssociationsApi.createNonAssociation.mockRejectedValue(error)

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

        expect(res.text).not.toContain('The non-association has been added to each prisoner’s profile')
        expect(res.text).toContain('Non-association could not be saved') // error message
        expect(res.text).toContain('An incident occurred yesterday') // form still pre-filled
      })
  })
})
