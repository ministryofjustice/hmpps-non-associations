import { convertToTitleCase } from '../utils/utils'
import { NomisUserRolesApi, type Caseload } from '../data/nomisUserRolesApi'
import ManageUsersApiClient, { User } from '../data/manageUsersApiClient'

export interface UserDetails extends User {
  displayName: string
  caseloads: Array<Caseload>
  activeCaseload: Caseload
}

export default class UserService {
  // eslint-disable-next-line no-empty-function
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
