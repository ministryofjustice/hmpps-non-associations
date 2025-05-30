import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes, mockUser, mockReadOnlyUser, mockUserWithGlobalSearch } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations } from '../data/constants'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { OffenderSearchClient, type OffenderSearchResult } from '../data/offenderSearch'
import { mockNonAssociation } from '../data/testData/nonAssociationsApi'
import { davidJones, fredMills, oscarJones, andrewBrown, maxClarke, joePeters } from '../data/testData/offenderSearch'
import { mockRestClientError } from '../data/testData/restClientError'

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
  it.each([
    {
      scenario: 'does not have write permissions',
      user: mockReadOnlyUser,
      prisoner: davidJones,
      otherPrisoner: fredMills,
      expectEarly404: true,
    },
    {
      scenario: 'is missing global search and neither prisoner is in caseloads',
      user: {
        ...mockUser,
        roles: [userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations],
      },
      prisoner: andrewBrown,
      otherPrisoner: maxClarke,
      expectEarly404: false,
    },
    {
      scenario: 'is missing inactive bookings role and neither prisoner is in caseloads',
      user: mockUserWithGlobalSearch,
      prisoner: joePeters,
      otherPrisoner: andrewBrown,
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
      .get(routeUrls.update(p1.prisonerNumber, na.id))
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
        expect(nonAssociationsApi.updateNonAssociation).not.toHaveBeenCalled()
      })
  })

  it('should return 404 if prisoner is not found', () => {
    offenderSearchClient.getPrisoner.mockRejectedValue(mockRestClientError(404))
    nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)

    return request(app)
      .get(routeUrls.update(prisonerNumber, nonAssociationId))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
        expect(nonAssociationsApi.updateNonAssociation).not.toHaveBeenCalled()
      })
  })

  it('should return 404 if the non-association is not found', () => {
    nonAssociationsApi.getNonAssociation.mockRejectedValue(mockRestClientError(404))

    return request(app)
      .get(routeUrls.update(prisonerNumber, nonAssociationId))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(nonAssociationsApi.getNonAssociation).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.getPrisoner).not.toHaveBeenCalled()
        expect(nonAssociationsApi.updateNonAssociation).not.toHaveBeenCalled()
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
        expect(nonAssociationsApi.updateNonAssociation).not.toHaveBeenCalled()
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
        expect(nonAssociationsApi.updateNonAssociation).not.toHaveBeenCalled()
      })
  })

  describe('rendering a form before anything was submitted', () => {
    it.each([
      ['via 1st prisoner', [prisoner, otherPrisoner]],
      ['via 2nd prisoner', [otherPrisoner, prisoner]],
    ])(
      'should loads data in correct order when opening form %s',
      (scenario: string, prisonersOrder: Array<OffenderSearchResult>) => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const [prisoner, otherPrisoner] = prisonersOrder
        nonAssociationsApi.getNonAssociation.mockResolvedValueOnce(nonAssociation)
        offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
        offenderSearchClient.getPrisoner.mockResolvedValueOnce(otherPrisoner)

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

            const davidJonesRoleLabel = 'David Jones’ role'
            const fredMillsRoleLabel = 'Fred Mills’ role'
            const [prisonerRoleLabel, otherPrisonerRoleLabel] =
              prisoner.prisonerNumber === davidJones.prisonerNumber
                ? [davidJonesRoleLabel, fredMillsRoleLabel]
                : [fredMillsRoleLabel, davidJonesRoleLabel]
            const prisonerRolePosition = res.text.indexOf(prisonerRoleLabel)
            const otherPrisonerRolePosition = res.text.indexOf(otherPrisonerRoleLabel)
            expect(prisonerRolePosition).toBeGreaterThan(0)
            expect(prisonerRolePosition).toBeLessThan(otherPrisonerRolePosition)
            expect(res.text).toContain('For example, equal parties or co-defendants')

            expect(res.text).toContain(`/prisoner/${prisoner.prisonerNumber}/non-associations/${nonAssociation.id}`)
          })
      },
    )
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
    nonAssociationsApi.updateNonAssociation.mockRejectedValue(mockRestClientError(400))

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
