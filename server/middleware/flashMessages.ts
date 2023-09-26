import type { RequestHandler } from 'express'

/**
 * Middleware to lazy-load flash messages from `connect-flash` upon access,
 * from view templates for example.
 * NB: once read, the messages are reset
 */
export default function flashMessages(): RequestHandler {
  return (req, res, next) => {
    Object.defineProperty(res.locals, 'messages', {
      enumerable: true,

      get(): Record<string, string[]> {
        return req.flash()
      },
    })

    next()
  }
}
