/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { AuthenticationClient, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import ManageUsersApiClient from './manageUsersApiClient'
import FrontendComponentsClient from './frontendComponentsClient'
import { createRedisClient } from './redisClient'
import config from '../config'
import logger from '../../logger'
import HmppsAuditClient from './hmppsAuditClient'

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient: new AuthenticationClient(config.apis.hmppsAuth, logger, new RedisTokenStore(createRedisClient())),
  hmppsAuditClient: new HmppsAuditClient(config.sqs.audit),
  manageUsersApiClient: new ManageUsersApiClient(),
  frontendComponentsClient: new FrontendComponentsClient(),
})

export type DataAccess = ReturnType<typeof dataAccess>
export { AuthenticationClient, HmppsAuditClient }
