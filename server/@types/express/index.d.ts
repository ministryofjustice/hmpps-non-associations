import type { Breadcrumbs } from '../../middleware/breadcrumbs'
import type { UserPermissions } from '../../middleware/userPermissions'
import type { UserDetails } from '../../services/userService'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
  }
}

export declare global {
  namespace Express {
    interface User extends Partial<UserDetails> {
      token: string
      roles?: string[]
      permissions?: UserPermissions
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      breadcrumbs: Breadcrumbs
      messages: Partial<Record<'information' | 'success' | 'warning', string[]>>
      user: Express.User
    }
  }
}
