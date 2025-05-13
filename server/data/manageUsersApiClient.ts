import { asSystem } from '@ministryofjustice/hmpps-rest-client'

import ConcreteRestClient from './concreteRestClient'
import config from '../config'
import logger from '../../logger'

export interface User {
  username: string
  name?: string
  active?: boolean
  authSource?: string
  uuid?: string
  userId?: string
  staffId?: number // deprecated, use userId
  activeCaseLoadId?: string // deprecated, use user roles api
}

export default class ManageUsersApiClient {
  constructor() {}

  private static restClient(token: string): ConcreteRestClient {
    return new ConcreteRestClient('Manage Users Api Client', config.apis.manageUsersApi, logger, {
      getToken: async () => token,
    })
  }

  getUser(token: string): Promise<User> {
    logger.info('Getting user details: calling HMPPS Manage Users Api')
    return ManageUsersApiClient.restClient(token).get<User>({ path: '/users/me' }, asSystem())
  }
}
