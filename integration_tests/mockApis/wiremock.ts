import superagent, { type SuperAgentRequest, type Response } from 'superagent'

const wiremockAdminUrl = 'http://localhost:9091/__admin'

export const stubFor = (mapping: Record<string, unknown>): SuperAgentRequest =>
  superagent.post(`${wiremockAdminUrl}/mappings`).send(mapping)

export const getMatchingRequests = (body: string | object) =>
  superagent.post(`${wiremockAdminUrl}/requests/find`).send(body)

export const resetStubs = (): Promise<Array<Response>> =>
  Promise.all([superagent.delete(`${wiremockAdminUrl}/mappings`), superagent.delete(`${wiremockAdminUrl}/requests`)])
