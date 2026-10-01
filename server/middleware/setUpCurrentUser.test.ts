import express, { type Express } from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'

import type { Services } from '../services'
import type UserService from '../services/userService'
import { mockActiveCaseload, mockCaseloads } from '../routes/testutils/appSetup'
import setUpCurrentUser from './setUpCurrentUser'

describe('setUpCurrentUser', () => {
  const userService = {
    getUser: jest.fn().mockResolvedValue({
      username: 'user1',
      name: 'FIRST LAST',
      userId: 'manage-users-id',
      displayName: 'First Last',
      activeCaseload: mockActiveCaseload,
      caseloads: mockCaseloads,
    }),
  } as unknown as jest.Mocked<UserService>

  function appWithToken(claims: Record<string, unknown>): { app: Express; currentUser: () => Express.User } {
    let currentUser: Express.User
    const app = express()
    app.use((_req, res, next) => {
      res.locals.user = { token: jwt.sign({ user_name: 'user1', ...claims }, 'secret'), username: 'user1' }
      next()
    })
    app.use(setUpCurrentUser({ userService } as unknown as Services))
    app.get('/', (_req, res) => {
      currentUser = res.locals.user
      res.send('OK')
    })
    return { app, currentUser: () => currentUser }
  }

  it('takes the user id and UUID from the sign-in token', async () => {
    const { app, currentUser } = appWithToken({
      user_id: '231232',
      user_uuid: '11111111-1111-1111-1111-111111111111',
    })

    await request(app).get('/').expect(200)

    expect(currentUser()).toEqual(
      expect.objectContaining({
        username: 'user1',
        userId: '231232',
        userUuid: '11111111-1111-1111-1111-111111111111',
        activeCaseload: mockActiveCaseload,
      }),
    )
  })

  it('keeps the user id from manage users and leaves the UUID unset when the token does not have them', async () => {
    const { app, currentUser } = appWithToken({})

    await request(app).get('/').expect(200)

    expect(currentUser().userId).toEqual('manage-users-id')
    expect(currentUser().userUuid).toBeUndefined()
  })
})
