import config from '../config'
import RestClient from './restClient'

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
}
