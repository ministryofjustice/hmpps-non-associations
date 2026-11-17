import nock from 'nock'

import config from '../config'
import ManageUsersApiClient from './manageUsersApiClient'
import { staffMary } from './testData/manageUsers'

const token = { access_token: 'token-1', expires_in: 300 }

describe('manageUsersApiClient', () => {
  let fakeManageUsersApiClient: nock.Scope
  let manageUsersApiClient: ManageUsersApiClient

  beforeEach(() => {
    fakeManageUsersApiClient = nock(config.apis.manageUsersApi.url)
    manageUsersApiClient = new ManageUsersApiClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getUser', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeManageUsersApiClient
        .get('/users/me')
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await manageUsersApiClient.getUser(token.access_token)
      expect(output).toEqual(response)
    })
  })

  describe('getUserByUsername', () => {
    const systemToken = 'system-token'
    const { username } = staffMary

    it('returns the user', async () => {
      fakeManageUsersApiClient
        .get(`/users/${username}`)
        .matchHeader('authorization', `Bearer ${systemToken}`)
        .reply(200, staffMary)

      const output = await manageUsersApiClient.getUserByUsername(systemToken, username)
      expect(output).toEqual(staffMary)
    })

    it('returns null if not found', async () => {
      fakeManageUsersApiClient.get(`/users/${username}`).thrice().reply(404)

      const output = await manageUsersApiClient.getUserByUsername(systemToken, username)
      expect(output).toBeNull()
    })

    it('throws when it receives another error', async () => {
      fakeManageUsersApiClient.get(`/users/${username}`).thrice().reply(500)

      await expect(manageUsersApiClient.getUserByUsername(systemToken, username)).rejects.toThrow(
        'Internal Server Error',
      )
    })
  })
})
