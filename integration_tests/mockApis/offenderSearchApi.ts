import type { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'
import { OffenderSearchClient, type OffenderSearchResult } from '../../server/data/offenderSearch'
import { mockPrisoners } from '../../server/data/testData/offenderSearch'

export default {
  stubOffenderSearchPing(): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/offenderSearchApi/health/ping',
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
  stubOffenderSearchGetPrisoner(): Promise<unknown> {
    return Promise.all(
      mockPrisoners.map(prisoner => {
        return stubFor({
          request: {
            method: 'GET',
            urlPattern: `/offenderSearchApi/prisoner/${encodeURIComponent(prisoner.prisonerNumber)}`,
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
   * Stub searching for a prisoner
   */
  stubOffenderSearchResults({
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
    const query = `term=${encodeURIComponent(term)}&size=${
      OffenderSearchClient.PAGE_SIZE
    }&page=${page}&sort=lastName${encodeURIComponent(',')}ASC`
    return stubFor({
      request: {
        method: 'GET',
        url: `/offenderSearchApi/prison/${encodeURIComponent(prisonId)}/prisoners?${query}`,
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
