import type { Request, Response, NextFunction } from 'express'

import {
  userRolePrison,
  userRoleGlobalSearch,
  userRoleInactiveBookings,
  userRoleManageNonAssociations,
} from '../data/constants'
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

  it('should set no read/write flags if the user is missing roles', () => {
    const res = mockResponse([])
    userPermissionFlags()(req, res, next)

    expect(res.locals?.user?.permissions).toEqual({
      read: false,
      write: false,
      globalSearch: false,
      inactiveBookings: false,
    })
    expect(next).toHaveBeenCalled()
  })

  it('should set read flag if user has necessary role', () => {
    const res = mockResponse([userRolePrison])
    userPermissionFlags()(req, res, next)

    expect(res.locals?.user?.permissions).toEqual({
      read: true,
      write: false,
      globalSearch: false,
      inactiveBookings: false,
    })
    expect(next).toHaveBeenCalled()
  })

  it('should set read & write flags if user has necessary roles', () => {
    const res = mockResponse([userRolePrison, userRoleManageNonAssociations])
    userPermissionFlags()(req, res, next)

    expect(res.locals?.user?.permissions).toEqual({
      read: true,
      write: true,
      globalSearch: false,
      inactiveBookings: false,
    })
    expect(next).toHaveBeenCalled()
  })

  it('should set write flag only for prison users', () => {
    const res = mockResponse([userRoleManageNonAssociations])
    userPermissionFlags()(req, res, next)

    expect(res.locals?.user?.permissions).toEqual({
      read: false,
      write: false,
      globalSearch: false,
      inactiveBookings: false,
    })
    expect(next).toHaveBeenCalled()
  })

  describe('should set global search flag for users with necessary role', () => {
    it('if they have read permission', () => {
      const res = mockResponse([userRolePrison, userRoleGlobalSearch])
      userPermissionFlags()(req, res, next)

      expect(res.locals?.user?.permissions).toEqual({
        read: true,
        write: false,
        globalSearch: true,
        inactiveBookings: false,
      })
      expect(next).toHaveBeenCalled()
    })

    it('if they also have write permission', () => {
      const res = mockResponse([userRolePrison, userRoleGlobalSearch, userRoleManageNonAssociations])
      userPermissionFlags()(req, res, next)

      expect(res.locals?.user?.permissions).toEqual({
        read: true,
        write: true,
        globalSearch: true,
        inactiveBookings: false,
      })
      expect(next).toHaveBeenCalled()
    })

    it('but not if they don’t have read permission', () => {
      const res = mockResponse([userRoleGlobalSearch])
      userPermissionFlags()(req, res, next)

      expect(res.locals?.user?.permissions).toEqual({
        read: false,
        write: false,
        globalSearch: false,
        inactiveBookings: false,
      })
      expect(next).toHaveBeenCalled()
    })
  })

  describe('should set inactive bookinds flag for users with necessary role', () => {
    it('if they have read permission', () => {
      const res = mockResponse([userRolePrison, userRoleInactiveBookings])
      userPermissionFlags()(req, res, next)

      expect(res.locals?.user?.permissions).toEqual({
        read: true,
        write: false,
        globalSearch: false,
        inactiveBookings: true,
      })
      expect(next).toHaveBeenCalled()
    })

    it('if they also have write permission', () => {
      const res = mockResponse([userRolePrison, userRoleInactiveBookings, userRoleManageNonAssociations])
      userPermissionFlags()(req, res, next)

      expect(res.locals?.user?.permissions).toEqual({
        read: true,
        write: true,
        globalSearch: false,
        inactiveBookings: true,
      })
      expect(next).toHaveBeenCalled()
    })

    it('but not if they don’t have read permission', () => {
      const res = mockResponse([userRoleInactiveBookings])
      userPermissionFlags()(req, res, next)

      expect(res.locals?.user?.permissions).toEqual({
        read: false,
        write: false,
        globalSearch: false,
        inactiveBookings: false,
      })
      expect(next).toHaveBeenCalled()
    })
  })

  it('should set all flags for users with all necessary permissions', () => {
    const res = mockResponse([
      userRolePrison,
      userRoleGlobalSearch,
      userRoleInactiveBookings,
      userRoleManageNonAssociations,
    ])
    userPermissionFlags()(req, res, next)

    expect(res.locals?.user?.permissions).toEqual({
      read: true,
      write: true,
      globalSearch: true,
      inactiveBookings: true,
    })
    expect(next).toHaveBeenCalled()
  })
})
