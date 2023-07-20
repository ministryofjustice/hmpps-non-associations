import * as fs from 'fs'
import * as path from 'path'

import type { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'

export default {
  stubPrisonApiPing: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },

  stubPrisonApiGetPhoto: (): SuperAgentRequest => {
    const imagePath = path.join(__dirname, '..', '..', 'assets', 'images', 'prisoner.jpeg')
    const imageContents = fs.readFileSync(imagePath, { encoding: 'base64' })

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/api/bookings/offenderNo/([A-Z0-9]+)/image/data',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'images/jpeg',
        },
        base64Body: imageContents,
      },
    })
  },
}
