import type { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'
import type { NonAssociationsList } from '../../server/data/nonAssociationsApi'
import {
  davidJones0NonAssociations,
  davidJones1OpenNonAssociation,
  davidJones2OpenNonAssociations,
  mockNonAssociation,
} from '../../server/data/testData/nonAssociationsApi'
import { davidJones, fredMills } from '../../server/data/testData/offenderSearch'

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
    returning?: 'none' | 'oneOpen' | 'twoOpen'
  } = {}): SuperAgentRequest => {
    let nonAssociationsList: NonAssociationsList
    if (returning === 'none') {
      nonAssociationsList = davidJones0NonAssociations
    } else if (returning === 'oneOpen') {
      nonAssociationsList = davidJones1OpenNonAssociation
    } else {
      nonAssociationsList = davidJones2OpenNonAssociations
    }

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prisoner/${encodeURIComponent(prisonerNumber)}/non-associations`,
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
        urlPattern: '/non-associations/\\d+',
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
        urlPattern: '/non-associations',
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber),
      },
    })
  },

  stubUpdateNonAssociation: () => {
    return stubFor({
      request: {
        method: 'PATCH',
        urlPattern: '/non-associations/\\d+',
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
        urlPattern: '/non-associations/\\d+/close',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, false),
      },
    })
  },
}
