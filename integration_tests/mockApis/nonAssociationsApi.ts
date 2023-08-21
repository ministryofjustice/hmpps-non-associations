import type { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'
import type { NonAssociationsList } from '../../server/data/nonAssociationsApi'
import {
  davidJones0NonAssociations,
  davidJones1OpenNonAssociation,
  davidJones2OpenNonAssociations,
  davidJones1ClosedNonAssociation,
  davidJones2ClosedNonAssociations,
  mockNonAssociation,
} from '../../server/data/testData/nonAssociationsApi'
import { andrewBrown, davidJones, fredMills } from '../../server/data/testData/offenderSearch'

/**
 * TODO: THIS ENTIRE API IS A WORK-IN-PROGRESS
 */

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

  stubListNonAssociations: ({
    prisonerNumber = davidJones.prisonerNumber,
    returning = 'twoOpen',
  }: {
    prisonerNumber?: string
    returning?: 'none' | 'oneOpen' | 'twoOpen' | 'oneClosed' | 'twoClosed'
  } = {}): SuperAgentRequest => {
    let nonAssociationsList: NonAssociationsList
    if (returning === 'none') {
      nonAssociationsList = davidJones0NonAssociations
    } else if (returning === 'oneOpen') {
      nonAssociationsList = davidJones1OpenNonAssociation
    } else if (returning === 'twoOpen') {
      nonAssociationsList = davidJones2OpenNonAssociations
    } else if (returning === 'oneClosed') {
      nonAssociationsList = davidJones1ClosedNonAssociation
    } else if (returning === 'twoClosed') {
      nonAssociationsList = davidJones2ClosedNonAssociations
    }

    return stubFor({
      request: {
        method: 'GET',
        urlPathPattern: `/nonAssociationsApi/prisoner/${encodeURIComponent(prisonerNumber)}/non-associations`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: nonAssociationsList,
      },
    })
  },

  stubGetNonAssociation: () => {
    return stubFor({
      request: {
        method: 'GET',
        urlPathPattern: '/nonAssociationsApi/non-associations/\\d+',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber),
      },
    })
  },

  stubCreateNonAssociation: () => {
    return stubFor({
      request: {
        method: 'POST',
        urlPathPattern: '/nonAssociationsApi/non-associations',
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: mockNonAssociation(davidJones.prisonerNumber, andrewBrown.prisonerNumber),
      },
    })
  },

  stubUpdateNonAssociation: () => {
    return stubFor({
      request: {
        method: 'PATCH',
        urlPathPattern: '/nonAssociationsApi/non-associations/\\d+',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber),
      },
    })
  },

  stubCloseNonAssociation: () => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPathPattern: '/nonAssociationsApi/non-associations/\\d+/close',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, false),
      },
    })
  },
}
