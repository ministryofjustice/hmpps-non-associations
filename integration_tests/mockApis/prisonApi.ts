import fs from 'node:fs'
import path from 'node:path'

import type { SuperAgentRequest } from 'superagent'

import applicationInfo from '../../server/applicationInfo'
import { stubFor } from './wiremock'

export default {
  stubPrisonApiPing(): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/prisonApi/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },

  /**
   * Use generic photo for all prisoners
   */
  stubPrisonApiGetPhoto(): SuperAgentRequest {
    const imagePath = path.join(applicationInfo().assetsPath, 'images', 'prisoner.jpeg')
    const imageContents = fs.readFileSync(imagePath, { encoding: 'base64' })

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/api/bookings/offenderNo/([A-Z0-9]+)/image/data',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
        base64Body: imageContents,
      },
    })
  },
}
