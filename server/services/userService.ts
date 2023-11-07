import { convertToTitleCase } from '../utils/utils'
import { NomisUserRolesApi, type UserCaseloads } from '../data/nomisUserRolesApi'
import ManageUsersApiClient, { User } from '../data/manageUsersApiClient'

export interface UserDetails extends User, UserCaseloads {
  displayName: string
}

export default class UserService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  async getUser(token: string): Promise<UserDetails> {
    return this.manageUsersApiClient.getUser(token).then(user => {
      const nomisUserRolesApi = new NomisUserRolesApi(token)

      return nomisUserRolesApi.getUserCaseloads().then(uc => {
        return {
          ...user,
          displayName: convertToTitleCase(user.name),
          caseloads: uc.caseloads,
          activeCaseload: uc.activeCaseload,
        }
      })
    })
  }
}
