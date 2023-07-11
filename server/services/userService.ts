import { convertToTitleCase } from '../utils/utils'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import { NomisUserRolesApi, type UserCaseloads } from '../data/nomisUserRolesApi'

export interface UserDetails extends UserCaseloads {
  name: string
  displayName: string
}

export default class UserService {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getUser(token: string): Promise<UserDetails> {
    const nomisUserRolesApi = new NomisUserRolesApi(token)

    const user = await this.hmppsAuthClient.getUser(token)
    const userCaseloads = await nomisUserRolesApi.getUserCaseloads()

    return {
      ...user,
      ...userCaseloads,
      displayName: convertToTitleCase(user.name),
    }
  }
}
