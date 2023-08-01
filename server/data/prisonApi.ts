import config from '../config'
import RestClient from './restClient'

export type StaffMember = {
  username: string
  firstName: string
  lastName: string
}

export default class PrisonApi extends RestClient {
  constructor(token: string) {
    super('HMPPS Prison API', config.apis.hmppsPrisonApi, token)
  }

  getPhoto(prisonerNumber: string): Promise<Buffer | null> {
    return this.get({
      path: `/api/bookings/offenderNo/${encodeURIComponent(prisonerNumber)}/image/data?fullSizeImage=false`,
      handle404: true,
    })
  }

  getStaffDetails(username: string): Promise<StaffMember | null> {
    return this.get<StaffMember>({
      path: `/api/users/${username}`,
      handle404: true,
    })
  }
}
