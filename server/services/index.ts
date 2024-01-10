import { dataAccess } from '../data'
import routeUrls from './routeUrls'
import UserService from './userService'

export const services = () => {
  const { hmppsAuthClient, manageUsersApiClient, frontendComponentsClient, applicationInfo } = dataAccess()

  const userService = new UserService(manageUsersApiClient)

  return {
    applicationInfo,
    userService,
    routeUrls,
    frontendComponentsClient,
    hmppsAuthClient,
  }
}

export type Services = ReturnType<typeof services>
