import type { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'
import type { LegacyNonAssociationsList } from '../../server/data/nonAssociationsApi'
import {
  sampleEmptyLegacyNonAssociation,
  sampleSingleLegacyNonAssociation,
  sampleMultipleLegacyNonAssociation,
} from '../../server/data/testData/nonAssociationsApi'

export default {
  stubNonAssociationsApiPing: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/nonAssociationsApi/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },

  stubLegacyNonAssociations: ({
    bookingId = 100001,
    returning = 'multiple',
  }: {
    bookingId?: number
    returning?: 'empty' | 'single' | 'multiple'
  } = {}): SuperAgentRequest => {
    let nonAssociationsList: LegacyNonAssociationsList
    if (returning === 'empty') {
      nonAssociationsList = sampleEmptyLegacyNonAssociation
    } else if (returning === 'single') {
      nonAssociationsList = sampleSingleLegacyNonAssociation
    } else {
      nonAssociationsList = sampleMultipleLegacyNonAssociation
    }

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/nonAssociationsApi/legacy/api/bookings/${bookingId}/non-association-details`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: nonAssociationsList,
      },
    })
  },
}
