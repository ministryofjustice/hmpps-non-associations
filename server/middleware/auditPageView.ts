import type { Request, RequestHandler } from 'express'

import logger from '../../logger'
import type AuditService from '../services/auditService'
import type { PageViewSubject } from '../services/auditService'

/**
 * Requests that are not page views: the home redirect into DPS and the prisoner photo asset.
 * Health checks and static resources are mounted earlier in app.ts so never reach here.
 */
const notPageViews = [/^\/(?:\?.*)?$/, /^\/prisoner\/[^/]+\/photo\.jpeg(?:\?.*)?$/]

/** Prisoner numbers appear in the path of every audited page */
const prisonerNumberInPath = /\/prisoner\/([A-Z][0-9]{4}[A-Z]{2})\b/

/**
 * Audits page views to HMPPS Audit.
 *
 * Emits PAGE_VIEW_ACCESS_ATTEMPT once the response closes – covering redirects, errors and
 * requests refused downstream by the authorisation middleware – and PAGE_VIEW when a page
 * renders successfully.
 *
 * Mount after authentication but before authorisation, so that refused requests are still
 * recorded as attempts.
 */
export default function auditPageView(auditService: AuditService): RequestHandler {
  return (req, res, next) => {
    const who = res.locals.user?.username
    if (!who || notPageViews.some(pattern => pattern.test(req.originalUrl))) {
      next()
      return
    }

    res.locals.auditEvent = {
      who,
      correlationId: req.id,
      details: { pageUrl: req.originalUrl },
    }
    const subject = subjectOfRequest(req)

    res.prependOnceListener('close', () => {
      logPageView(auditService, res.locals.auditEvent, subject, true)
    })

    type ResRender = (view: string, options?: object, callback?: (err: Error, html: string) => void) => void
    const resRender = res.render as ResRender
    res.render = (view: string, options?: object) => {
      resRender.call(res, view, options, (err: Error, html: string) => {
        if (err) {
          next(err)
          return
        }
        // send the page first: auditing must never delay or break rendering
        res.send(html)
        logPageView(auditService, res.locals.auditEvent, subject)
      })
    }

    next()
  }
}

function subjectOfRequest(req: Request): PageViewSubject {
  const prisonerNumber = req.originalUrl.match(prisonerNumberInPath)?.[1]
  const searchTerm = typeof req.query?.q === 'string' ? req.query.q : undefined
  return { prisonerNumber, searchTerm }
}

function logPageView(
  auditService: AuditService,
  auditEvent: Express.Locals['auditEvent'],
  subject: PageViewSubject,
  isAttempt = false,
): void {
  if (!auditEvent) return
  auditService.logPageView(auditEvent, subject, isAttempt).catch(error => {
    logger.error(error, 'Failed to audit page view')
  })
}
