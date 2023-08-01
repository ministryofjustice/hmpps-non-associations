import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { NonAssociationsApi, type SortBy, type SortDirection } from '../data/nonAssociationsApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import PrisonApi from '../data/prisonApi'
import {
  davidJones0NonAssociations,
  davidJones1OpenNonAssociation,
  davidJones2OpenNonAssociations,
  davidJones1ClosedNonAssociation,
  davidJones2ClosedNonAssociations,
} from '../data/testData/nonAssociationsApi'
import { davidJones } from '../data/testData/offenderSearch'
import { mockGetStaffDetails } from '../data/testData/prisonApi'
import type { ViewData } from '../forms/view'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/nonAssociationsApi', () => {
  // ensures that constants are preserved
  type module = typeof import('../data/nonAssociationsApi')
  const realModule = jest.requireActual<module>('../data/nonAssociationsApi')
  const mockedModule = jest.createMockFromModule<module>('../data/nonAssociationsApi')
  return { __esModule: true, ...realModule, NonAssociationsApi: mockedModule.NonAssociationsApi }
})
jest.mock('../data/offenderSearch')
jest.mock('../data/prisonApi')

// mock "key" prisoner
const { prisonerNumber } = davidJones
const prisoner = davidJones

let app: Express
let nonAssociationsApi: jest.Mocked<NonAssociationsApi>
let offenderSearchClient: jest.Mocked<OffenderSearchClient>
let prisonApi: jest.Mocked<PrisonApi>

beforeEach(() => {
  app = appWithAllRoutes({})

  nonAssociationsApi = NonAssociationsApi.prototype as jest.Mocked<NonAssociationsApi>
  offenderSearchClient = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
  offenderSearchClient.getPrisoner.mockResolvedValue(prisoner)
  prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Non-associations list page', () => {
  describe('should return 404 if prisoner is not found', () => {
    beforeEach(() => {
      const error: SanitisedError = {
        name: 'Error',
        status: 404,
        message: 'Not Found',
        stack: 'Not Found',
      }
      offenderSearchClient.getPrisoner.mockRejectedValue(error)
    })

    it('when listing open non-associations', () => {
      return request(app)
        .get(routeUrls.view(prisonerNumber))
        .expect(404)
        .expect(res => {
          expect(res.text).not.toContain('Jones, David')
          expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()
        })
    })

    it('when listing closed non-associations', () => {
      return request(app)
        .get(routeUrls.view(prisonerNumber, true))
        .expect(404)
        .expect(res => {
          expect(res.text).not.toContain('Jones, David')
          expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()
        })
    })
  })

  describe('should render breadcrumbs', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones1OpenNonAssociation)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.view(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Jones, David')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones1ClosedNonAssociation)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.view(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Jones, David')
        })
    })
  })

  describe('should list all non-associations for a prisoner', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones2OpenNonAssociations)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.view(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('cde87s')

          // table
          expect(res.text).toContain('app-sortable-table')
          expect(res.text).toContain('Mills, Fred')
          expect(res.text).toContain('Cell and landing')
          expect(res.text).toContain('See IR 12133111')
          expect(res.text).toContain('26 July 2023')
          expect(res.text).toContain('by Mary Johnson')
          expect(res.text).toContain('by Mark Simmons')
          expect(res.text).toContain('Actions')
          // no message
          expect(res.text).not.toContain('This prisoner has no open non-associations')
          expect(res.text).not.toContain('This prisoner has no closed non-associations')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones2ClosedNonAssociations)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.view(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(3)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('cde87s')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('lev79n')

          // table
          expect(res.text).toContain('app-sortable-table')
          expect(res.text).toContain('Mills, Fred')
          expect(res.text).toContain('Cell and landing')
          expect(res.text).not.toContain('See IR 12133111')
          expect(res.text).toContain('Problem solved')
          expect(res.text).not.toContain('26 July 2023')
          expect(res.text).toContain('27 July 2023')
          expect(res.text).toContain('by Mary Johnson')
          expect(res.text).toContain('by Mark Simmons')
          expect(res.text).not.toContain('Actions')
          // no message
          expect(res.text).not.toContain('This prisoner has no open non-associations')
          expect(res.text).not.toContain('This prisoner has no closed non-associations')
        })
    })
  })

  describe('should sort non-associations showing most recently updated first by default', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones1OpenNonAssociation)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.view(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledWith('A1234BC', {
            includeOpen: true,
            includeClosed: false,
            sortBy: 'WHEN_UPDATED',
            sortDirection: 'DESC',
          })
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones1ClosedNonAssociation)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.view(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledWith('A1234BC', {
            includeOpen: false,
            includeClosed: true,
            sortBy: 'WHEN_UPDATED',
            sortDirection: 'DESC',
          })
        })
    })
  })

  const sortingScenarios: {
    scenario: string
    query: Partial<ViewData>
    expected: {
      sortBy: SortBy
      sortDirection: SortDirection
    }
  }[] = [
    {
      scenario: 'oldest',
      query: { sort: 'WHEN_CREATED', order: 'ASC' },
      expected: {
        sortBy: 'WHEN_CREATED',
        sortDirection: 'ASC',
      },
    },
    {
      scenario: 'prisoner surname',
      query: { sort: 'LAST_NAME' },
      expected: {
        sortBy: 'LAST_NAME',
        sortDirection: 'DESC',
      },
    },
    {
      scenario: 'prisoner surname specifying direction',
      query: { sort: 'LAST_NAME', order: 'ASC' },
      expected: {
        sortBy: 'LAST_NAME',
        sortDirection: 'ASC',
      },
    },
  ]
  describe.each(sortingScenarios)('should allow sorting non-associations by $scenario', ({ query, expected }) => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones1OpenNonAssociation)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.view(prisonerNumber))
        .query(query)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledWith('A1234BC', {
            ...expected,
            includeOpen: true,
            includeClosed: false,
          })
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones1ClosedNonAssociation)
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.view(prisonerNumber, true))
        .query(query)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(() => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledWith('A1234BC', {
            ...expected,
            includeOpen: false,
            includeClosed: true,
          })
        })
    })
  })

  describe('should show an error mesage in the unlikely event of sort options being invalid', () => {
    it('when listing open non-associations', () => {
      return request(app)
        .get(routeUrls.view(prisonerNumber))
        .query({ sort: 'age' })
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          expect(res.text).toContain('There is a problem')
          expect(res.text).not.toContain('app-sortable-table')
        })
    })

    it('when listing closed non-associations', () => {
      return request(app)
        .get(routeUrls.view(prisonerNumber, true))
        .query({ sort: 'age' })
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).not.toHaveBeenCalled()
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          expect(res.text).toContain('There is a problem')
          expect(res.text).not.toContain('app-sortable-table')
        })
    })
  })

  describe('should display “System” instead of internal system username as the authoriser', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce({
        ...davidJones2OpenNonAssociations,
        nonAssociations: davidJones2OpenNonAssociations.nonAssociations.map((nonAssociation, index) => {
          const authorisedBy = index === 1 ? 'NON_ASSOCIATIONS_API' : nonAssociation.authorisedBy
          return {
            ...nonAssociation,
            authorisedBy,
            updatedBy: authorisedBy,
          }
        }),
      })
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.view(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('NON_ASSOCIATIONS_API')

          // table
          expect(res.text).toContain('by Mary Johnson')
          expect(res.text).toContain('by System')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce({
        ...davidJones2ClosedNonAssociations,
        nonAssociations: davidJones2ClosedNonAssociations.nonAssociations.map((nonAssociation, index) => {
          const authorisedBy = index === 1 ? 'NON_ASSOCIATIONS_API' : nonAssociation.authorisedBy
          return {
            ...nonAssociation,
            authorisedBy,
            updatedBy: authorisedBy,
          }
        }),
      })
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.view(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(3)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('lev79n')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('NON_ASSOCIATIONS_API')

          // table
          expect(res.text).toContain('by Mary Johnson')
          expect(res.text).toContain('by System')
        })
    })
  })

  describe('should only look up unique staff usernames', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce({
        ...davidJones2OpenNonAssociations,
        nonAssociations: davidJones2OpenNonAssociations.nonAssociations.map(nonAssociation => {
          return {
            ...nonAssociation,
            authorisedBy: 'abc12a',
            updatedBy: 'abc12a',
          }
        }),
      })
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.view(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')

          // table
          expect(res.text).toContain('by Mary Johnson')
          expect(res.text).not.toContain('by System')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce({
        ...davidJones2ClosedNonAssociations,
        nonAssociations: davidJones2ClosedNonAssociations.nonAssociations.map(nonAssociation => {
          return {
            ...nonAssociation,
            authorisedBy: 'abc12a',
            updatedBy: 'abc12a',
          }
        }),
      })
      prisonApi.getStaffDetails.mockImplementation(mockGetStaffDetails)

      return request(app)
        .get(routeUrls.view(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledTimes(2)
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('abc12a')
          expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('lev79n')

          // table
          expect(res.text).toContain('by Mary Johnson')
          expect(res.text).not.toContain('by System')
        })
    })
  })

  describe('should show a message when there are no non-associations', () => {
    it('when listing open non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones0NonAssociations)

      return request(app)
        .get(routeUrls.view(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          // message
          expect(res.text).toContain('This prisoner has no open non-associations in Moorland (HMP)')
          expect(res.text).not.toContain('This prisoner has no closed non-associations')
          // no table
          expect(res.text).not.toContain('app-sortable-table')
        })
    })

    it('when listing closed non-associations', () => {
      nonAssociationsApi.listNonAssociations.mockResolvedValueOnce(davidJones0NonAssociations)

      return request(app)
        .get(routeUrls.view(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          // message
          expect(res.text).toContain('This prisoner has no closed non-associations in Moorland (HMP)')
          expect(res.text).not.toContain('This prisoner has no open non-associations')
          // no table
          expect(res.text).not.toContain('app-sortable-table')
        })
    })
  })

  describe('should show generic error page when api returns an error', () => {
    beforeEach(() => {
      const error: SanitisedError = {
        name: 'Error',
        status: 500,
        message: 'Internal Server Error',
        stack: 'Error: Internal Server Error',
      }
      nonAssociationsApi.listNonAssociations.mockRejectedValue(error)
    })

    it('when listing open non-associations', () => {
      return request(app)
        .get(routeUrls.view(prisonerNumber))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          // message
          expect(res.text).toContain('Non-associations could not be loaded')
          expect(res.text).not.toContain('This prisoner has no open non-associations')
          expect(res.text).not.toContain('This prisoner has no closed non-associations')
          // no table
          expect(res.text).not.toContain('app-sortable-table')
        })
    })

    it('when listing closed non-associations', () => {
      return request(app)
        .get(routeUrls.view(prisonerNumber, true))
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(nonAssociationsApi.listNonAssociations).toHaveBeenCalledTimes(1)
          expect(prisonApi.getStaffDetails).not.toHaveBeenCalled()

          // message
          expect(res.text).toContain('Non-associations could not be loaded')
          expect(res.text).not.toContain('This prisoner has no open non-associations')
          expect(res.text).not.toContain('This prisoner has no closed non-associations')
          // no table
          expect(res.text).not.toContain('app-sortable-table')
        })
    })
  })
})
