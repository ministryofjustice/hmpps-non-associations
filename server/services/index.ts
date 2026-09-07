import { AuditServiceFactory } from '@ministryofjustice/hmpps-audit-client'

import config from '../config'
import logger from '../../logger'
import { dataAccess } from '../data'
import routeUrls from './routeUrls'
import UserService from './userService'

export const services = () => {
  const { hmppsAuthClient, manageUsersApiClient, frontendComponentsClient, applicationInfo } = dataAccess()

  const userService = new UserService(manageUsersApiClient)
  const auditService = AuditServiceFactory.createInstance(config.sqs.audit, logger)

  return {
    applicationInfo,
    userService,
    auditService,
    routeUrls,
    frontendComponentsClient,
    hmppsAuthClient,
  }
}

export type Services = ReturnType<typeof services>
