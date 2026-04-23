import type { Request, Response } from 'express'

import authorisationMiddleware from './authorisationMiddleware'
import { createTestToken } from '../utils/auth'

describe('authorisationMiddleware', () => {
  let req: Request
  const next = jest.fn()

  async function createResWithToken({ authorities }: { authorities: string[] }): Promise<Response> {
    return {
      locals: {
        user: {
          token: await createTestToken(authorities),
        },
      },
      redirect: jest.fn(),
    } as unknown as Response
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should return next when no required roles', async () => {
    const res = await createResWithToken({ authorities: [] })

    authorisationMiddleware()(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
    expect(res.locals.user.roles).toEqual([])
  })

  it('should redirect when user has no authorised roles', async () => {
    const res = await createResWithToken({ authorities: [] })

    authorisationMiddleware(['SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith('/authError')
    expect(res.locals.user.roles).toEqual([])
  })

  it('should return next when user has authorised role', async () => {
    const res = await createResWithToken({ authorities: ['ROLE_SOME_REQUIRED_ROLE'] })

    authorisationMiddleware(['SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
    expect(res.locals.user.roles).toEqual(['ROLE_SOME_REQUIRED_ROLE'])
  })

  it('should return next when user has authorised role and middleware created with ROLE_ prefix', async () => {
    const res = await createResWithToken({ authorities: ['ROLE_SOME_REQUIRED_ROLE'] })

    authorisationMiddleware(['ROLE_SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
    expect(res.locals.user.roles).toEqual(['ROLE_SOME_REQUIRED_ROLE'])
  })
})
