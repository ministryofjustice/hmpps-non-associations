import type { SuperAgentRequest, Response } from 'superagent'

import { stubFor } from './wiremock'
import { OffenderSearchClient, type OffenderSearchResult } from '../../server/data/offenderSearch'
import { mockPrisoners } from '../../server/data/testData/offenderSearch'

export default {
  stubOffenderSearchPing(): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/offenderSearchApi/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },

  /**
   * Stub gettings details for all mock prisoners
   */
  stubOffenderSearchGetPrisoner(): Promise<Response[]> {
    return Promise.all(
      mockPrisoners.map(prisoner => {
        return stubFor({
          request: {
            method: 'GET',
            urlPath: `/offenderSearchApi/prisoner/${encodeURIComponent(prisoner.prisonerNumber)}`,
          },
          response: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            jsonBody: prisoner,
          },
        })
      }),
    )
  },

  /**
   * Stub searching for a prisoner in a prison
   */
  stubOffenderSearchResultsInPrison({
    prisonId,
    term,
    results,
    page = 0,
    totalElements = undefined,
  }: {
    prisonId: string
    term: string
    results: OffenderSearchResult[]
    page: number
    totalElements: number | undefined
  }): SuperAgentRequest {
    const queryRegex = [
      `term=${encodeURIComponent(term)}`,
      `size=${OffenderSearchClient.PAGE_SIZE}`,
      `page=${page}`,
    ].join('&')
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/offenderSearchApi/prison/${encodeURIComponent(prisonId)}/prisoners\\?.*${queryRegex}.*`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          content: results,
          totalElements: totalElements ?? results.length,
        },
      },
    })
  },

  /**
   * Stub searching for a prisoner globally
   * NB: this stub ignores filters so all searches match
   */
  stubOffenderSearchResultsGlobally({
    results,
    page = 0,
    totalElements = undefined,
  }: {
    results: OffenderSearchResult[]
    page: number
    totalElements: number | undefined
  }): SuperAgentRequest {
    const queryRegex = [`size=${OffenderSearchClient.PAGE_SIZE}`, `page=${page}`].join('&')
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/offenderSearchApi/global-search\\?.*${queryRegex}.*`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          content: results,
          totalElements: totalElements ?? results.length,
        },
      },
    })
  },
}
