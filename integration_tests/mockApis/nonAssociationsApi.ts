import type { NonAssociation, NonAssociationsList } from '@ministryofjustice/hmpps-non-associations-api'
import type { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'
import {
  davidJones0NonAssociations,
  davidJones1OpenNonAssociation,
  davidJones2OpenNonAssociations,
  davidJones1ClosedNonAssociation,
  davidJones2ClosedNonAssociations,
  mockNonAssociation,
} from '../../server/data/testData/nonAssociationsApi'
import { davidJones, fredMills } from '../../server/data/testData/offenderSearch'

export default {
  stubNonAssociationsApiPing(): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/nonAssociationsApi/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },

  /**
   * Stub the list of non-associations for David Jones
   */
  stubListNonAssociations({
    returning = 'twoOpen',
  }: {
    returning?: 'none' | 'oneOpen' | 'twoOpen' | 'oneClosed' | 'twoClosed'
  } = {}): SuperAgentRequest {
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
    const urlPath = `/nonAssociationsApi/prisoner/${encodeURIComponent(davidJones.prisonerNumber)}/non-associations`
    return stubFor({
      request: {
        method: 'GET',
        urlPath,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: nonAssociationsList,
      },
    })
  },

  /**
   * Stub the non-associations between a group of prisoners
   */
  stubListNonAssociationsBetween({
    prisonerNumbers,
    nonAssociations = [],
  }: {
    prisonerNumbers: string[]
    nonAssociations?: NonAssociation[]
  }): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: '/nonAssociationsApi/non-associations/between',
        bodyPatterns: [{ equalToJson: prisonerNumbers }],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: nonAssociations,
      },
    })
  },

  /**
   * Stub the non-associations involving any of a group of prisoners
   */
  stubListNonAssociationsInvolving({
    prisonerNumbers,
    nonAssociations = [],
  }: {
    prisonerNumbers: string[]
    nonAssociations?: NonAssociation[]
  }): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: '/nonAssociationsApi/non-associations/involving',
        bodyPatterns: [{ equalToJson: prisonerNumbers }],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: nonAssociations,
      },
    })
  },

  /**
   * Stub the non-association between David Jones and Fred Mills
   */
  stubGetNonAssociation(): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/nonAssociationsApi/non-associations/101',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber),
      },
    })
  },

  /**
   * Stub creating a non-association between David Jones and Fred Mills
   */
  stubCreateNonAssociation(): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: '/nonAssociationsApi/non-associations',
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber),
      },
    })
  },

  /**
   * Stub updating a non-association between David Jones and Oscar Jones
   */
  stubUpdateNonAssociation(): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'PATCH',
        urlPath: '/nonAssociationsApi/non-associations/101',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber),
      },
    })
  },

  /**
   * Stub closing a non-association between David Jones and Fred Mills
   */
  stubCloseNonAssociation(): SuperAgentRequest {
    return stubFor({
      request: {
        method: 'PUT',
        urlPath: '/nonAssociationsApi/non-associations/101/close',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: mockNonAssociation(davidJones.prisonerNumber, fredMills.prisonerNumber, true),
      },
    })
  },
}
