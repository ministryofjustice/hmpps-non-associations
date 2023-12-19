import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import {
  appWithAllRoutes,
  mockUser,
  mockReadOnlyUser,
  mockUserWithoutGlobalSearch,
  mockUserWithGlobalSearch,
} from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations } from '../data/constants'
import { NonAssociationsApi } from '../data/nonAssociationsApi'
import { OffenderSearchClient, type OffenderSearchResults } from '../data/offenderSearch'
import { mockNonAssociation } from '../data/testData/nonAssociationsApi'
import {
  davidJones,
  fredMills,
  oscarJones,
  maxClarke,
  joePeters,
  sampleOffenderSearchResults,
} from '../data/testData/offenderSearch'

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

let app: Express
let nonAssociationsApi: jest.Mocked<NonAssociationsApi>
let offenderSearchClient: jest.Mocked<OffenderSearchClient>

beforeEach(() => {
  app = appWithAllRoutes({})

  nonAssociationsApi = NonAssociationsApi.prototype as jest.Mocked<NonAssociationsApi>
  offenderSearchClient = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>

  nonAssociationsApi.listNonAssociationsBetween.mockResolvedValue([])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Search for a prisoner page', () => {
  it.each([
    {
      scenario: 'does not have write permissions',
      user: mockReadOnlyUser,
      prisoner: davidJones,
    },
    {
      scenario: 'is missing global search and key prisoner is not in caseloads',
      user: {
        ...mockUser,
        roles: [userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations],
      },
      prisoner: maxClarke,
    },
    {
      scenario: 'is missing inactive bookings role and key prisoner is not in caseloads',
      user: mockUserWithGlobalSearch,
      prisoner: joePeters,
    },
  ])('should return 404 if user $scenario', ({ user, prisoner: p }) => {
    app = appWithAllRoutes({
      userSupplier: () => user,
    })
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(p)

    return request(app)
      .get(routeUrls.prisonerSearch(p.prisonerNumber))
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain(p.firstName)
        expect(res.text).not.toContain(p.lastName)
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()
        expect(offenderSearchClient.searchGlobally).not.toHaveBeenCalled()
        expect(nonAssociationsApi.listNonAssociationsBetween).not.toHaveBeenCalled()
      })
  })

  it('should return 404 if prisoner is not found', () => {
    const error: SanitisedError = {
      name: 'Error',
      status: 404,
      message: 'Not Found',
      stack: 'Not Found',
    }
    offenderSearchClient.getPrisoner.mockRejectedValueOnce(error)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
        expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()
        expect(offenderSearchClient.searchGlobally).not.toHaveBeenCalled()
        expect(nonAssociationsApi.listNonAssociationsBetween).not.toHaveBeenCalled()
      })
  })

  it('should not display search results when loaded', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .expect(200)
      .expect(res => {
        // heading
        expect(res.text).toContain('Search for a prisoner to keep apart from David Jones')
        // no table
        expect(res.text).not.toContain('app-sortable-table')
        // no "nothing found" message
        expect(res.text).not.toContain('0 results found')
        // search not performed
        expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()
        expect(offenderSearchClient.searchGlobally).not.toHaveBeenCalled()
        expect(nonAssociationsApi.listNonAssociationsBetween).not.toHaveBeenCalled()
      })
  })

  it.each([
    {
      scenario: 'global search',
      user: mockUserWithGlobalSearch,
    },
    {
      scenario: 'global search and inactive bookings role',
      user: mockUser,
    },
  ])('should show radio buttons to select scope if user has $scenario', ({ user }) => {
    app = appWithAllRoutes({
      userSupplier: () => user,
    })
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('In Moorland')
        expect(res.text).toContain('In any establishment (global)')
        // search not performed
        expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()
        expect(offenderSearchClient.searchGlobally).not.toHaveBeenCalled()
      })
  })

  function expectResultsTable(res: request.Response): void {
    // heading
    expect(res.text).toContain('Search for a prisoner to keep apart from David Jones')
    // show result count
    expect(res.text).toContain('Showing <b>1</b> to <b>2</b> of <b>2</b> prisoners')
    // shows table
    expect(res.text).toContain('app-sortable-table')
    expect(res.text).toContain('Mills, Fred')
    expect(res.text).toContain('href="http://dps.local/prisoner/A1235EF"')
    expect(res.text).toContain('Jones, Oscar')
    expect(res.text).toContain('href="http://dps.local/prisoner/A1236CS"')
    expect(res.text).toContain('Moorland (HMP)')
    // no "nothing found" message
    expect(res.text).not.toContain('0 results found')
  }

  it('should display search results when a prison search query is entered', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.searchInPrison.mockResolvedValueOnce(sampleOffenderSearchResults)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        q: 'Smith ',
        formId: 'search',
        page: '1',
      })
      .expect(200)
      .expect(res => {
        expectResultsTable(res)
        // correct search is performed
        expect(offenderSearchClient.searchInPrison).toHaveBeenCalledTimes(1)
        const [prison, search, page, sort, order] = offenderSearchClient.searchInPrison.mock.calls[0]
        expect(prison).toEqual('MDI')
        expect(search).toEqual('Smith')
        expect(page).toEqual(0) // NB: page is 0-indexed in offender search
        expect(sort).toEqual('lastName')
        expect(order).toEqual('ASC')
        expect(offenderSearchClient.searchGlobally).not.toHaveBeenCalled()

        // checked for open non-associations but found none
        expect(nonAssociationsApi.listNonAssociationsBetween).toHaveBeenCalledTimes(1)
        expect(nonAssociationsApi.listNonAssociationsBetween).toHaveBeenCalledWith([
          prisonerNumber,
          fredMills.prisonerNumber,
          oscarJones.prisonerNumber,
        ])
        expect(res.text).not.toContain('View non-association')
      })
  })

  it('should display search results when a global search query is entered by a user with inactive bookings role', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.searchGlobally.mockResolvedValueOnce(sampleOffenderSearchResults)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        scope: 'global',
        q: 'Smith ',
        formId: 'search',
        page: '1',
      })
      .expect(200)
      .expect(res => {
        expectResultsTable(res)
        // correct search is performed
        expect(offenderSearchClient.searchGlobally).toHaveBeenCalledTimes(1)
        const [filters, page] = offenderSearchClient.searchGlobally.mock.calls[0]
        expect(filters.lastName).toEqual('Smith')
        expect(filters.firstName).toBeUndefined()
        expect(filters.prisonerIdentifier).toBeUndefined()
        expect(filters.location).toEqual('ALL')
        expect(filters.includeAliases).toEqual(true)
        expect(page).toEqual(0) // NB: page is 0-indexed in offender search
        expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()

        // checked for open non-associations but found none
        expect(nonAssociationsApi.listNonAssociationsBetween).toHaveBeenCalledTimes(1)
        expect(nonAssociationsApi.listNonAssociationsBetween).toHaveBeenCalledWith([
          prisonerNumber,
          fredMills.prisonerNumber,
          oscarJones.prisonerNumber,
        ])
        expect(res.text).not.toContain('View non-association')
      })
  })

  it('should display search results when a global search query is entered by a user without inactive bookings role', () => {
    app = appWithAllRoutes({
      userSupplier: () => mockUserWithGlobalSearch,
    })
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.searchGlobally.mockResolvedValueOnce(sampleOffenderSearchResults)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        scope: 'global',
        q: 'Smith ',
        formId: 'search',
        page: '1',
      })
      .expect(200)
      .expect(res => {
        expectResultsTable(res)
        // correct search is performed
        expect(offenderSearchClient.searchGlobally).toHaveBeenCalledTimes(1)
        const [filters, page] = offenderSearchClient.searchGlobally.mock.calls[0]
        expect(filters.lastName).toEqual('Smith')
        expect(filters.firstName).toBeUndefined()
        expect(filters.prisonerIdentifier).toBeUndefined()
        expect(filters.location).toEqual('IN')
        expect(filters.includeAliases).toEqual(true)
        expect(page).toEqual(0) // NB: page is 0-indexed in offender search
        expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()

        // checked for open non-associations but found none
        expect(nonAssociationsApi.listNonAssociationsBetween).toHaveBeenCalledTimes(1)
        expect(nonAssociationsApi.listNonAssociationsBetween).toHaveBeenCalledWith([
          prisonerNumber,
          fredMills.prisonerNumber,
          oscarJones.prisonerNumber,
        ])
        expect(res.text).not.toContain('View non-association')
      })
  })

  it('should not display a blank location if prisoner search returns nothing', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    const mockSearchResults: OffenderSearchResults = {
      content: [fredMills].map(result => {
        // eslint-disable-next-line no-param-reassign
        delete result.prisonName
        // eslint-disable-next-line no-param-reassign
        result = {
          ...result,
          cellLocation: '',
          prisonId: undefined,
        }
        return result
      }),
      totalElements: 1,
    }
    offenderSearchClient.searchInPrison.mockResolvedValueOnce(mockSearchResults)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        q: 'Mills',
        formId: 'search',
        page: '1',
      })
      .expect(200)
      .expect(res => {
        let found = 0
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const match of res.text.matchAll(/Not known/g)) {
          found += 1
        }
        // "Not known" for both location and establishment columns of the 1 row of results
        expect(found).toEqual(2)
      })
  })

  it('should perform global search filtering by last name when 1 search term is provided', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.searchGlobally.mockResolvedValueOnce(sampleOffenderSearchResults)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        scope: 'global',
        q: 'MILLS ',
        formId: 'search',
        page: '1',
      })
      .expect(200)
      .expect(res => {
        // correct search is performed
        expect(offenderSearchClient.searchGlobally).toHaveBeenCalledTimes(1)
        const [filters, page] = offenderSearchClient.searchGlobally.mock.calls[0]
        expect(filters.lastName).toEqual('MILLS')
        expect(filters.firstName).toBeUndefined()
        expect(filters.prisonerIdentifier).toBeUndefined()
        expect(page).toEqual(0) // NB: page is 0-indexed in offender search
        expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()
      })
  })

  it('should perform global search filtering by first and last name when 2 search terms are provided', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.searchGlobally.mockResolvedValueOnce(sampleOffenderSearchResults)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        scope: 'global',
        q: 'mills fred',
        formId: 'search',
        page: '1',
      })
      .expect(200)
      .expect(res => {
        // correct search is performed
        expect(offenderSearchClient.searchGlobally).toHaveBeenCalledTimes(1)
        const [filters, page] = offenderSearchClient.searchGlobally.mock.calls[0]
        expect(filters.lastName).toEqual('mills')
        expect(filters.firstName).toEqual('fred')
        expect(filters.prisonerIdentifier).toBeUndefined()
        expect(page).toEqual(0) // NB: page is 0-indexed in offender search
        expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()
      })
  })

  it('should perform global search filtering by first and last name when more than 2 search terms are provided (ignoring surplus terms)', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.searchGlobally.mockResolvedValueOnce(sampleOffenderSearchResults)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        scope: 'global',
        q: 'MILLS FRED JENNINGS',
        formId: 'search',
        page: '1',
      })
      .expect(200)
      .expect(res => {
        // correct search is performed
        expect(offenderSearchClient.searchGlobally).toHaveBeenCalledTimes(1)
        const [filters, page] = offenderSearchClient.searchGlobally.mock.calls[0]
        expect(filters.lastName).toEqual('MILLS')
        expect(filters.firstName).toEqual('FRED')
        expect(filters.prisonerIdentifier).toBeUndefined()
        expect(page).toEqual(0) // NB: page is 0-indexed in offender search
        expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()
      })
  })

  it('should perform global search filtering by prisoner identifier when search term contains numbers', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    offenderSearchClient.searchGlobally.mockResolvedValueOnce(sampleOffenderSearchResults)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        scope: 'global',
        q: ' a1235ef ',
        formId: 'search',
        page: '1',
      })
      .expect(200)
      .expect(res => {
        // correct search is performed
        expect(offenderSearchClient.searchGlobally).toHaveBeenCalledTimes(1)
        const [filters, page] = offenderSearchClient.searchGlobally.mock.calls[0]
        expect(filters.lastName).toBeUndefined()
        expect(filters.firstName).toBeUndefined()
        expect(filters.prisonerIdentifier).toEqual('A1235EF')
        expect(page).toEqual(0) // NB: page is 0-indexed in offender search
        expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()
      })
  })

  describe.each([
    {
      scenario: 'there are no open non-associations',
      mockOpenNonAssociations: [],
      expected: ['Select prisoner'],
      unexpected: ['View non-association'],
    },
    {
      scenario: 'one search result has an open non-association with the key prisoner',
      mockOpenNonAssociations: [mockNonAssociation(prisonerNumber, oscarJones.prisonerNumber)],
      expected: ['Select prisoner', 'View non-association', `/prisoner/${prisonerNumber}/non-associations/101`],
      unexpected: [],
    },
    {
      scenario: 'two search results have open non-associations with the key prisoner',
      mockOpenNonAssociations: [
        mockNonAssociation(fredMills.prisonerNumber, prisonerNumber),
        mockNonAssociation(prisonerNumber, oscarJones.prisonerNumber),
      ].map((nonAssociation, index) => {
        // eslint-disable-next-line no-param-reassign
        nonAssociation.id += index + 1
        return nonAssociation
      }),
      expected: [
        'View non-association',
        `/prisoner/${prisonerNumber}/non-associations/102`,
        `/prisoner/${prisonerNumber}/non-associations/103`,
      ],
      unexpected: ['Select prisoner'],
    },
    {
      scenario: 'there are open non-associations but not involving the key prisoner',
      mockOpenNonAssociations: [mockNonAssociation(fredMills.prisonerNumber, oscarJones.prisonerNumber)],
      expected: ['Select prisoner'],
      unexpected: ['View non-association', `/prisoner/${prisonerNumber}/non-associations/101`],
    },
  ])('when $scenario', ({ mockOpenNonAssociations, expected, unexpected }) => {
    beforeEach(() => {
      offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
      offenderSearchClient.searchInPrison.mockResolvedValueOnce(sampleOffenderSearchResults)
      offenderSearchClient.searchGlobally.mockResolvedValueOnce(sampleOffenderSearchResults)
      nonAssociationsApi.listNonAssociationsBetween.mockResolvedValueOnce(mockOpenNonAssociations)
    })

    function maybeExpectViewLinks(res: request.Response) {
      expect(nonAssociationsApi.listNonAssociationsBetween).toHaveBeenCalledTimes(1)
      expect(nonAssociationsApi.listNonAssociationsBetween).toHaveBeenCalledWith([
        prisonerNumber,
        fredMills.prisonerNumber,
        oscarJones.prisonerNumber,
      ])

      expected.forEach(str => expect(res.text).toContain(str))
      unexpected.forEach(str => expect(res.text).not.toContain(str))
    }

    it('view links might show in prison search', () => {
      app = appWithAllRoutes({
        userSupplier: () => mockUserWithGlobalSearch,
      })

      return request(app)
        .get(routeUrls.prisonerSearch(prisonerNumber))
        .query({
          q: 'Smith ',
          formId: 'search',
          page: '1',
        })
        .expect(200)
        .expect(res => {
          maybeExpectViewLinks(res)
        })
    })

    it('view links might show in global search', () => {
      return request(app)
        .get(routeUrls.prisonerSearch(prisonerNumber))
        .query({
          scope: 'global',
          q: 'Smith ',
          formId: 'search',
          page: '1',
        })
        .expect(200)
        .expect(res => {
          maybeExpectViewLinks(res)
        })
    })
  })

  it.each([
    {
      scenario: 'a prison search is performed',
      user: mockUserWithoutGlobalSearch,
      query: {
        q: 'Smith',
        formId: 'search',
        page: '1',
      },
      expectGlobalSearch: false,
    },
    {
      scenario: 'a global search is performed',
      user: mockUser,
      query: {
        scope: 'global',
        q: 'Smith',
        formId: 'search',
        page: '1',
      },
      expectGlobalSearch: true,
    },
  ])('should display a message if no results were returned when $scenario', ({ user, query, expectGlobalSearch }) => {
    app = appWithAllRoutes({
      userSupplier: () => user,
    })
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    const mockSearchResults: OffenderSearchResults = { content: [], totalElements: 0 }
    offenderSearchClient.searchInPrison.mockResolvedValueOnce(mockSearchResults)
    offenderSearchClient.searchGlobally.mockResolvedValueOnce(mockSearchResults)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query(query)
      .expect(200)
      .expect(res => {
        // heading
        expect(res.text).toContain('Search for a prisoner to keep apart from David Jones')
        // no table
        expect(res.text).not.toContain('app-sortable-table')
        // shows "nothing found" message
        expect(res.text).toContain('0 results found for “Smith”')
        // search performed
        if (expectGlobalSearch) {
          expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()
          expect(offenderSearchClient.searchGlobally).toHaveBeenCalledTimes(1)
        } else {
          expect(offenderSearchClient.searchInPrison).toHaveBeenCalledTimes(1)
          expect(offenderSearchClient.searchGlobally).not.toHaveBeenCalled()
        }
        expect(nonAssociationsApi.listNonAssociationsBetween).not.toHaveBeenCalled()
      })
  })

  it('should display an error if an empty query is submitted', () => {
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        q: '',
        formId: 'search',
        page: '1',
      })
      .expect(200)
      .expect(res => {
        // heading
        expect(res.text).toContain('Search for a prisoner to keep apart from David Jones')
        // error summary shows
        expect(res.text).toContain('There is a problem')
        // no table
        expect(res.text).not.toContain('app-sortable-table')
        // no "nothing found" message
        expect(res.text).not.toContain('0 results found')
        // search not performed
        expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()
        expect(offenderSearchClient.searchGlobally).not.toHaveBeenCalled()
        expect(nonAssociationsApi.listNonAssociationsBetween).not.toHaveBeenCalled()
      })
  })

  it.each([
    {
      scenario: 'prison search',
      user: mockUserWithoutGlobalSearch,
      query: {
        q: 'Smith',
        formId: 'search',
        page: '2',
        sort: 'prisonerNumber',
        order: 'DESC',
      },
      expectGlobalSearch: false,
    },
    {
      scenario: 'global search',
      user: mockUser,
      query: {
        scope: 'global',
        q: 'Smith',
        formId: 'search',
        page: '2',
      },
      expectGlobalSearch: true,
    },
  ])('should show pagination when there are many results for $scenario', ({ user, query, expectGlobalSearch }) => {
    app = appWithAllRoutes({
      userSupplier: () => user,
    })
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    const mockSearchResults: OffenderSearchResults = {
      content: sampleOffenderSearchResults.content,
      totalElements: 100,
    }
    offenderSearchClient.searchInPrison.mockResolvedValueOnce(mockSearchResults)
    offenderSearchClient.searchGlobally.mockResolvedValueOnce(mockSearchResults)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query(query)
      .expect(200)
      .expect(res => {
        // pagination shows
        expect(res.text).toContain('moj-pagination__results')
        if (expectGlobalSearch) {
          expect(res.text).toContain('scope=global&amp;q=Smith&amp;formId=search')
        } else {
          expect(res.text).toContain('sort=prisonerNumber&amp;order=DESC')
        }
        expect(res.text).toContain('Showing <b>21</b> to <b>40</b> of <b>100</b> prisoners')
        // shows table
        expect(res.text).toContain('app-sortable-table')
        // no "nothing found" message
        expect(res.text).not.toContain('0 results found')
        // correct search is performed
        if (expectGlobalSearch) {
          expect(offenderSearchClient.searchGlobally).toHaveBeenCalledTimes(1)
          const [filters, page] = offenderSearchClient.searchGlobally.mock.calls[0]
          expect(filters.lastName).toEqual('Smith')
          expect(page).toEqual(1) // NB: page is 0-indexed in offender search
          expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()
        } else {
          expect(offenderSearchClient.searchInPrison).toHaveBeenCalledTimes(1)
          const [prison, search, page, sort, order] = offenderSearchClient.searchInPrison.mock.calls[0]
          expect(prison).toEqual('MDI')
          expect(search).toEqual('Smith')
          expect(page).toEqual(1) // NB: page is 0-indexed in offender search
          expect(sort).toEqual('prisonerNumber')
          expect(order).toEqual('DESC')
          expect(offenderSearchClient.searchGlobally).not.toHaveBeenCalled()
        }
      })
  })

  it.each([
    {
      scenario: 'prison search',
      user: mockUserWithoutGlobalSearch,
      query: {
        q: 'S',
        formId: 'search',
        page: '1',
      },
      expectGlobalSearch: false,
    },
    {
      scenario: 'global search',
      user: mockUser,
      query: {
        scope: 'global',
        q: 'S',
        formId: 'search',
        page: '1',
      },
      expectGlobalSearch: true,
    },
  ])('should not show the "key" prisoner in results for $scenario', ({ user, query, expectGlobalSearch }) => {
    app = appWithAllRoutes({
      userSupplier: () => user,
    })
    offenderSearchClient.getPrisoner.mockResolvedValueOnce(prisoner)
    const mockSearchResults: OffenderSearchResults = {
      content: [davidJones, ...sampleOffenderSearchResults.content],
      totalElements: sampleOffenderSearchResults.totalElements + 1,
    }
    offenderSearchClient.searchInPrison.mockResolvedValueOnce(mockSearchResults)
    offenderSearchClient.searchGlobally.mockResolvedValueOnce(mockSearchResults)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query(query)
      .expect(200)
      .expect(res => {
        // show result count
        expect(res.text).toContain('Showing <b>1</b> to <b>3</b> of <b>3</b> prisoners')
        // shows table
        expect(res.text).toContain('app-sortable-table')
        // fred mill not shown in table
        expect(res.text).not.toContain('Photo of David Jones')
        expect(res.text).toContain('Photo of Fred Mills')
        // no pagination
        expect(res.text).not.toContain('moj-pagination__item')
        // no "nothing found" message
        expect(res.text).not.toContain('0 results found')
        // search performed
        if (expectGlobalSearch) {
          expect(offenderSearchClient.searchInPrison).not.toHaveBeenCalled()
          expect(offenderSearchClient.searchGlobally).toHaveBeenCalledTimes(1)
        } else {
          expect(offenderSearchClient.searchInPrison).toHaveBeenCalledTimes(1)
          expect(offenderSearchClient.searchGlobally).not.toHaveBeenCalled()
        }
      })
  })
})
