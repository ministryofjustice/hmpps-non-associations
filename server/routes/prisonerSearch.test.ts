import type { Express } from 'express'
import request from 'supertest'

import { SanitisedError } from '../sanitisedError'
import { appWithAllRoutes } from './testutils/appSetup'
import routeUrls from '../services/routeUrls'
import { OffenderSearchClient } from '../data/offenderSearch'
import { davidJones, sampleOffenderSearchResults } from '../data/testData/offenderSearch'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/offenderSearch', () => {
  // ensures that sort and order constants are preserved
  type module = typeof import('../data/offenderSearch')
  const realModule = jest.requireActual<module>('../data/offenderSearch')
  const mockedModule = jest.createMockFromModule<module>('../data/offenderSearch')
  return { __esModule: true, ...realModule, OffenderSearchClient: mockedModule.OffenderSearchClient }
})

// mock "key" prisoner
const { prisonerNumber } = davidJones
const prisoner = davidJones

let app: Express
let offenderSearchClient: jest.Mocked<OffenderSearchClient>

beforeEach(() => {
  app = appWithAllRoutes({})

  offenderSearchClient = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
  offenderSearchClient.getPrisoner.mockResolvedValue(prisoner)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Search for a prisoner page', () => {
  it('should return 404 if prisoner is not found', () => {
    const error: SanitisedError = {
      name: 'Error',
      status: 404,
      message: 'Not Found',
      stack: 'Not Found',
    }
    offenderSearchClient.getPrisoner.mockRejectedValue(error)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Jones, David')
        expect(offenderSearchClient.getPrisoner).toHaveBeenCalledTimes(1)
      })
  })

  it('should render breadcrumbs', () => {
    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Jones, David')
      })
  })

  it('should not display search results when loaded', () => {
    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .expect(200)
      .expect(res => {
        // heading
        expect(res.text).toContain('Search for a prisoner to keep apart from David Jones')
        expect(res.text).not.toContain('Select a prisoner')
        // no table
        expect(res.text).not.toContain('app-sortable-table')
        // no "nothing found" message
        expect(res.text).not.toContain('0 results found')
        // search not performed
        expect(offenderSearchClient.search).toHaveBeenCalledTimes(0)
      })
  })

  it('should display search results when a query is entered', () => {
    offenderSearchClient.search.mockResolvedValue(sampleOffenderSearchResults)

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        q: 'Smith ',
        formId: 'search',
        page: '1',
      })
      .expect(200)
      .expect(res => {
        // heading
        expect(res.text).not.toContain('Search for a prisoner to keep apart from David Jones')
        expect(res.text).toContain('Select a prisoner')
        // show result count
        expect(res.text).toContain('Prisoners listed: 2')
        // shows table
        expect(res.text).toContain('app-sortable-table')
        expect(res.text).toContain('Mills, Fred')
        expect(res.text).toContain('A1235EF')
        expect(res.text).toContain('Jones, Oscar')
        expect(res.text).toContain('A1236CS')
        // no "nothing found" message
        expect(res.text).not.toContain('0 results found')
        // correct search is performed
        expect(offenderSearchClient.search).toHaveBeenCalledTimes(1)
        const [prison, search, page, sort, order] = offenderSearchClient.search.mock.calls[0]
        expect(prison).toEqual('MDI')
        expect(search).toEqual('Smith')
        expect(page).toEqual(0) // NB: page is 0-indexed in offender search
        expect(sort).toEqual('lastName')
        expect(order).toEqual('ASC')
      })
  })

  it('should display a message if no results were returned', () => {
    offenderSearchClient.search.mockResolvedValue({ content: [], totalElements: 0 })

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        q: 'Smith',
        formId: 'search',
        page: '1',
      })
      .expect(200)
      .expect(res => {
        // heading
        expect(res.text).not.toContain('Search for a prisoner to keep apart from David Jones')
        expect(res.text).toContain('Select a prisoner')
        // no table
        expect(res.text).not.toContain('app-sortable-table')
        // shows "nothing found" message
        expect(res.text).toContain('0 results found for “Smith”')
        // search performed
        expect(offenderSearchClient.search).toHaveBeenCalledTimes(1)
      })
  })

  it('should display an error if an empty query is submitted', () => {
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
        expect(res.text).not.toContain('Select a prisoner')
        // error summary shows
        expect(res.text).toContain('There is a problem')
        // no table
        expect(res.text).not.toContain('app-sortable-table')
        // no "nothing found" message
        expect(res.text).not.toContain('0 results found')
        // search not performed
        expect(offenderSearchClient.search).toHaveBeenCalledTimes(0)
      })
  })

  it('should show pagination when there are many results', () => {
    offenderSearchClient.search.mockResolvedValue({ content: sampleOffenderSearchResults.content, totalElements: 100 })

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        q: 'Smith',
        formId: 'search',
        page: '2',
        sort: 'prisonerNumber',
        order: 'DESC',
      })
      .expect(200)
      .expect(res => {
        // pagination shows
        expect(res.text).toContain('govuk-pagination__list')
        expect(res.text).toContain('sort=prisonerNumber&amp;order=DESC')
        // shows table
        expect(res.text).toContain('app-sortable-table')
        // no "nothing found" message
        expect(res.text).not.toContain('0 results found')
        // correct search is performed
        expect(offenderSearchClient.search).toHaveBeenCalledTimes(1)
        const [prison, search, page, sort, order] = offenderSearchClient.search.mock.calls[0]
        expect(prison).toEqual('MDI')
        expect(search).toEqual('Smith')
        expect(page).toEqual(1) // NB: page is 0-indexed in offender search
        expect(sort).toEqual('prisonerNumber')
        expect(order).toEqual('DESC')
      })
  })

  it('should not show the "key" prisoner in results', () => {
    offenderSearchClient.search.mockResolvedValue({
      content: [davidJones, ...sampleOffenderSearchResults.content],
      totalElements: sampleOffenderSearchResults.totalElements + 1,
    })

    return request(app)
      .get(routeUrls.prisonerSearch(prisonerNumber))
      .query({
        q: 'S',
        formId: 'search',
        page: '1',
      })
      .expect(200)
      .expect(res => {
        // show result count
        expect(res.text).toContain('Prisoners listed: 2')
        // shows table
        expect(res.text).toContain('app-sortable-table')
        // fred mill not shown in table
        expect(res.text).not.toContain('Photo of David Jones')
        expect(res.text).toContain('Photo of Fred Mills')
        // no pagination
        expect(res.text).not.toContain('govuk-pagination__list')
        // no "nothing found" message
        expect(res.text).not.toContain('0 results found')
        // search performed
        expect(offenderSearchClient.search).toHaveBeenCalledTimes(1)
      })
  })
})
