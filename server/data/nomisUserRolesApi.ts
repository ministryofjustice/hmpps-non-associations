import config from '../config'
import RestClient from './restClient'

export interface Caseload {
  id: string
  name: string
}

export interface UserCaseloads {
  activeCaseload: Caseload
  caseloads: Array<Caseload>
}

export class NomisUserRolesApi extends RestClient {
  constructor(token: string) {
    super('NOMIS User Roles API', config.apis.nomisUserRolesApi, token)
  }

  getUserCaseloads(): Promise<UserCaseloads> {
    return this.get<UserCaseloads>({ path: '/me/caseloads' }).then(userCaseload => {
      return {
        activeCaseload: userCaseload.activeCaseload,
        caseloads: userCaseload.caseloads,
      }
    })
  }
}
