import { dataAccess } from '../data'
import routeUrls from './routeUrls'
import AuditService from './auditService'
import UserService from './userService'

export const services = () => {
  const { hmppsAuthClient, hmppsAuditClient, manageUsersApiClient, frontendComponentsClient, applicationInfo } =
    dataAccess()

  const userService = new UserService(manageUsersApiClient)
  const auditService = new AuditService(hmppsAuditClient)

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
