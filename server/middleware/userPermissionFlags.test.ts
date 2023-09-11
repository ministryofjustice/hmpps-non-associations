import type { Request, Response, NextFunction } from 'express'

import { userRolePrison, userRoleManageNonAssociations } from '../data/constants'
import userPermissionFlags from './userPermissionFlags'

function mockResponse(roles: string[]): Response {
  const locals = {
    user: { roles },
  } as Express.Locals
  return {
    locals,
  } as unknown as Response
}

describe('userPermissionFlags', () => {
  const req = jest.fn() as unknown as jest.Mocked<Request>
  const next = jest.fn() as jest.Mocked<NextFunction>

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should set no flags if the user is missing roles', () => {
    const res = mockResponse([])
    userPermissionFlags()(req, res, next)

    expect(res.locals?.user?.permissions).toEqual({
      read: false,
      write: false,
    })
    expect(next).toHaveBeenCalled()
  })

  it('should set view & list flags if user has necessary role', () => {
    const res = mockResponse([userRolePrison])
    userPermissionFlags()(req, res, next)

    expect(res.locals?.user?.permissions).toEqual({
      read: true,
      write: false,
    })
    expect(next).toHaveBeenCalled()
  })

  it('should set view, list, add, update & close flags if user has necessary roles', () => {
    const res = mockResponse([userRolePrison, userRoleManageNonAssociations])
    userPermissionFlags()(req, res, next)

    expect(res.locals?.user?.permissions).toEqual({
      read: true,
      write: true,
    })
    expect(next).toHaveBeenCalled()
  })

  it('should set add, update & close flags only for prison users', () => {
    const res = mockResponse([userRoleManageNonAssociations])
    userPermissionFlags()(req, res, next)

    expect(res.locals?.user?.permissions).toEqual({
      read: false,
      write: false,
    })
    expect(next).toHaveBeenCalled()
  })
})
