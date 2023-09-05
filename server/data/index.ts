/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import HmppsAuthClient from './hmppsAuthClient'
import { createRedisClient } from './redisClient'
import TokenStore from './tokenStore'
import config, { ApiConfig } from '../config'
import RestClient, { RestClientBuilder as CreateRestClientBuilder } from './restClient'
import { ComponentApiClient } from './dpsComponents/interfaces/componentApiClient'
import ComponentApiRestClient from './dpsComponents/componentApiClient'

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient: new HmppsAuthClient(new TokenStore(createRedisClient())),
  componentApiClientBuilder: restClientBuilder<ComponentApiClient>(
    'Component API',
    config.apis.frontendComponents,
    ComponentApiRestClient,
  ),
})

export type DataAccess = ReturnType<typeof dataAccess>

type RestClientBuilder<T> = (token: string) => T

export default function restClientBuilder<T>(
  name: string,
  options: ApiConfig,
  constructor: new (client: RestClient) => T,
): RestClientBuilder<T> {
  const restClient = CreateRestClientBuilder(name, options)
  return token => new constructor(restClient(token))
}

export { RestClientBuilder }
