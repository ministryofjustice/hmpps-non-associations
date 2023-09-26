import type { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'

export default {
  stubNomisUserRolesApiPing(): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/nomisUserRolesApi/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },

  /**
   * Stub the current user’s prison as HMP Moorland
   */
  stubNomisUserCaseloads(): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/nomisUserRolesApi/me/caseloads',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          activeCaseload: {
            id: 'MDI',
            name: 'Moorland (HMP & YOI)',
          },
          caseloads: [
            {
              id: 'MDI',
              name: 'Moorland (HMP & YOI)',
            },
          ],
        },
      },
    })
  },
}
