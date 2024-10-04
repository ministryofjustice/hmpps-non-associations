import superagent, { type SuperAgentRequest, type Response } from 'superagent'

const wiremockAdminUrl = 'http://localhost:9091/__admin'

/**
 * Incomplete definition when creating a new stub mapping
 * https://wiremock.org/docs/standalone/admin-api-reference/#tag/Stub-Mappings/operation/createNewStubMapping
 */
export interface Mapping {
  request?: Partial<
    {
      method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
      queryParameters: object
      bodyPatterns: { equalToJson: unknown }[]
    } & ({ url: string } | { urlPath: string } | { urlPathPattern: string } | { urlPattern: string })
  >
  response?: Partial<
    {
      status: number
      headers: Record<string, string>
    } & ({ jsonBody: unknown } | { body: string } | { base64Body: string })
  >
}

export const stubFor = (mapping: Mapping): SuperAgentRequest =>
  superagent.post(`${wiremockAdminUrl}/mappings`).send(mapping)

export const getMatchingRequests = (body: string | object) =>
  superagent.post(`${wiremockAdminUrl}/requests/find`).send(body)

export const resetStubs = (): Promise<Array<Response>> =>
  Promise.all([superagent.delete(`${wiremockAdminUrl}/mappings`), superagent.delete(`${wiremockAdminUrl}/requests`)])
