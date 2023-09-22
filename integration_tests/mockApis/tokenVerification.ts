import type { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubTokenVerificationPing(httpStatus = 200): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/verification/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    })
  },

  stubVerifyToken(active = true): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: '/verification/token/verify',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { active },
      },
    })
  },
}
