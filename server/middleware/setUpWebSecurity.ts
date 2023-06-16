import crypto from 'crypto'

import express, { Router, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'

import config from '../config'

export default function setUpWebSecurity(): Router {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((_req: Request, res: Response, next: NextFunction) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })
  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // This nonce allows us to use scripts with the use of the `cspNonce` local, e.g (in a Nunjucks template):
          // <script nonce="{{ cspNonce }}">
          // or
          // <link href="http://example.com/" rel="stylesheet" nonce="{{ cspNonce }}">
          // This ensures only scripts we trust are loaded, and not anything injected into the
          // page by an attacker.
          imgSrc: ["'self'", '*.google-analytics.com', '*.googletagmanager.com'],
          scriptSrc: [
            "'self'",
            '*.google-analytics.com',
            '*.googletagmanager.com',
            (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
          ],
          styleSrc: ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`],
          fontSrc: ["'self'"],
          formAction: [`'self' ${config.apis.hmppsAuth.externalUrl}`],
          connectSrc: ["'self'", '*.google-analytics.com', '*.googletagmanager.com', '*.analytics.google.com'],
        },
      },
      crossOriginEmbedderPolicy: { policy: 'require-corp' },
    }),
  )

  // cf. https://security-guidance.service.justice.gov.uk/implement-security-txt/
  router.get('/.well-known/security.txt', (req, res) =>
    res.redirect(301, 'https://security-guidance.service.justice.gov.uk/.well-known/security.txt'),
  )

  return router
}
