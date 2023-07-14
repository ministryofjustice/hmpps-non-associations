import type { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'
import { OffenderSearchClient, type OffenderSearchResult } from '../../server/data/offenderSearch'

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

  stubOffenderSearchResults(
    prisonId: string,
    term: string,
    results: OffenderSearchResult[],
    page: number = 0,
    totalElements: number | undefined = undefined,
  ): SuperAgentRequest {
    const query = `term=${encodeURIComponent(term)}&size=${OffenderSearchClient.PAGE_SIZE}&page=${page}`
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/offenderSearchApi/prison/${encodeURIComponent(prisonId)}/prisoners?${query}`,
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
