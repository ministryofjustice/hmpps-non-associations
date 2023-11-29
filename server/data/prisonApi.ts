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
    return this.get<Buffer>({
      path: `/api/bookings/offenderNo/${encodeURIComponent(prisonerNumber)}/image/data`,
      query: { fullSizeImage: 'false' },
    }).catch(error => {
      const status = error?.status
      if (status === 403 || status === 404) {
        // return null if unauthorised or not found
        return null
      }
      throw error
    })
  }

  getStaffDetails(username: string): Promise<StaffMember | null> {
    return this.get<StaffMember>({
      path: `/api/users/${username}`,
    }).catch(error => {
      const status = error?.status
      if (status === 403 || status === 404) {
        // return null if unauthorised or not found
        return null
      }
      throw error
    })
  }
}
