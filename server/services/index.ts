import { dataAccess } from '../data'
import routeUrls from './routeUrls'
import UserService from './userService'

export const services = () => {
  const { hmppsAuthClient, applicationInfo } = dataAccess()

  const userService = new UserService(hmppsAuthClient)

  return {
    applicationInfo,
    userService,
    routeUrls,
  }
}

export type Services = ReturnType<typeof services>
