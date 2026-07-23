import { AuthenticationClient, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'

import ManageUsersApiClient from './manageUsersApiClient'
import FrontendComponentsClient from './frontendComponentsClient'
import { createRedisClient } from './redisClient'
import config from '../config'
import logger from '../../logger'
import HmppsAuditClient from './hmppsAuditClient'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient: new AuthenticationClient(config.apis.hmppsAuth, logger, new RedisTokenStore(createRedisClient())),
  hmppsAuditClient: new HmppsAuditClient(config.sqs.audit),
  manageUsersApiClient: new ManageUsersApiClient(),
  frontendComponentsClient: new FrontendComponentsClient(),
})

export type DataAccess = ReturnType<typeof dataAccess>
export { AuthenticationClient, HmppsAuditClient }
