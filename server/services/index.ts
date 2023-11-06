import { dataAccess } from '../data'
import routeUrls from './routeUrls'
import UserService from './userService'
import ComponentService from './dpsComponentService'

export const services = () => {
  const { manageUsersApiClient, componentApiClientBuilder, applicationInfo } = dataAccess()

  const userService = new UserService(manageUsersApiClient)

  const componentService = new ComponentService(componentApiClientBuilder)

  return {
    applicationInfo,
    userService,
    routeUrls,
    manageUsersApiClient,
    componentService,
  }
}

export type Services = ReturnType<typeof services>
