import { dataAccess } from '../data'
import routeUrls from './routeUrls'
import UserService from './userService'
import ComponentService from './dpsComponentService'

export const services = () => {
  const { hmppsAuthClient, componentApiClientBuilder, applicationInfo } = dataAccess()

  const userService = new UserService(hmppsAuthClient)

  const componentService = new ComponentService(componentApiClientBuilder)

  return {
    applicationInfo,
    userService,
    routeUrls,
    hmppsAuthClient,
    componentService,
  }
}

export type Services = ReturnType<typeof services>
