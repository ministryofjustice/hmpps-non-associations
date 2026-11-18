import { RestClient, asUser, type SanitisedError } from '@ministryofjustice/hmpps-rest-client'

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

export default class ManageUsersApiClient extends RestClient {
  constructor() {
    super('Manage Users Api Client', config.apis.manageUsersApi, logger)
  }

  getUser(token: string): Promise<User> {
    return this.get<User>({ path: '/users/me' }, asUser(token))
  }

  /**
   * Look up any user by username, e.g. the member of staff who last updated a non-association.
   * Returns null if the user is not found.
   */
  getUserByUsername(systemToken: string, username: string): Promise<User | null> {
    return this.get<User>({ path: `/users/${encodeURIComponent(username)}` }, asUser(systemToken)).catch(
      (error: SanitisedError): null => {
        if (error?.responseStatus === 404) {
          return null
        }
        throw error
      },
    )
  }
}
