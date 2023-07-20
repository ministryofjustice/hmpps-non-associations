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

  stubOffenderSearchGetPrisonerResult({
    prisonerNumber,
    result,
  }: {
    prisonerNumber: string
    result: OffenderSearchResult
  }): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/offenderSearchApi/prisoner/${encodeURIComponent(prisonerNumber)}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: result,
      },
    })
  },

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
