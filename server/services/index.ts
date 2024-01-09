import { dataAccess } from '../data'
import routeUrls from './routeUrls'
import UserService from './userService'
import ComponentService from './dpsComponentService'

export const services = () => {
  const { hmppsAuthClient, manageUsersApiClient, componentApiClient, applicationInfo } = dataAccess()

  const userService = new UserService(manageUsersApiClient)

  const componentService = new ComponentService(componentApiClient)

  return {
    applicationInfo,
    userService,
    routeUrls,
    componentService,
    hmppsAuthClient,
  }
}

export type Services = ReturnType<typeof services>
