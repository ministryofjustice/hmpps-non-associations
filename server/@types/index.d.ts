import type { Breadcrumbs } from '../middleware/breadcrumbs'

export default {}

declare module '../routes/forms' {
  /**
   * Add properties here that are available to most request handlers in `res.locals`
   */
  interface AppLocals {
    breadcrumbs: Breadcrumbs
    user: Express.User
  }
}
