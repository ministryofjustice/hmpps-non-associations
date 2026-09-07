import express from 'express'
import request from 'supertest'

import { AuditService } from '@ministryofjustice/hmpps-audit-client'

import auditPageView from './auditPageView'

jest.mock('@ministryofjustice/hmpps-audit-client')

let auditService: jest.Mocked<AuditService>

const renderedHtml = '<html lang="en">page</html>'

/**
 * Minimal app mirroring app.ts’ ordering: user first, then the audit middleware, then routes.
 *
 * `res.render` is stubbed *before* the audit middleware so that the middleware wraps the stub,
 * exactly as it wraps the real nunjucks renderer in the running app.
 */
function appWithAuditing({
  user = { username: 'user1' } as Express.User,
  renderFails = false,
}: { user?: Express.User | null; renderFails?: boolean } = {}): express.Express {
  const app = express()

  app.use((req, res, next) => {
    req.id = 'request123'
    res.locals.user = user ?? undefined
    res.render = ((_view: string, _options?: object, callback?: (err: Error, html: string) => void) => {
      const error = renderFails ? new Error('render failed') : null
      if (callback) {
        callback(error, renderedHtml)
      } else if (error) {
        next(error)
      } else {
        res.send(renderedHtml)
      }
    }) as typeof res.render
    next()
  })

  app.get('*any', auditPageView(auditService))

  app.get('/', (req, res) => res.redirect('https://dps.example.com'))
  app.get('/prisoner/:prisonerNumber/photo.jpeg', (req, res) => res.send('image'))
  app.get('/prisoner/:prisonerNumber/non-associations', (req, res) => res.render('pages/list.njk'))
  app.get('/prisoner/:prisonerNumber/non-associations/add/search-prisoner', (req, res) =>
    res.render('pages/prisonerSearch.njk'),
  )
  app.get('/no-prisoner', (req, res) => res.render('pages/other.njk'))
  app.get('/search-prisoner', (req, res) => res.render('pages/prisonerSearch.njk'))

  app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(500).send('error')
  })

  return app
}

/** audit events logged, in the order the audit service saw them */
function loggedEvents() {
  return auditService.logAuditEvent.mock.calls.map(([event]) => ({
    subject: { subjectType: event.subjectType, subjectId: event.subjectId },
    what: event.action,
  }))
}

const forPrisoner = { subjectType: 'PRISONER_ID', subjectId: 'A1234BC' }

beforeEach(() => {
  auditService = new AuditService(null) as jest.Mocked<AuditService>
  auditService.logAuditEvent.mockResolvedValue(undefined)
})

describe('auditPageView', () => {
  it('logs a page view and an access attempt when a page renders', async () => {
    await request(appWithAuditing()).get('/prisoner/A1234BC/non-associations').expect(200).expect(renderedHtml)

    expect(loggedEvents()).toEqual([
      { subject: forPrisoner, what: 'PAGE_VIEW' },
      { subject: forPrisoner, what: 'PAGE_VIEW_ACCESS_ATTEMPT' },
    ])
  })

  it('passes the username, correlation id and page url to the audit service', async () => {
    await request(appWithAuditing()).get('/prisoner/A1234BC/non-associations').expect(200)

    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        who: 'user1',
        correlationId: 'request123',
        details: { pageUrl: '/prisoner/A1234BC/non-associations' },
      }),
      expect.anything(),
    )
  })

  it('picks up the search term from the query string', async () => {
    await request(appWithAuditing()).get('/prisoner/A1234BC/non-associations/add/search-prisoner?q=Jones').expect(200)

    expect(loggedEvents()[0].subject).toEqual({ subjectType: 'PRISONER_ID', subjectId: 'A1234BC' })
  })

  it('has neither prisoner nor search term for a page about neither', async () => {
    await request(appWithAuditing()).get('/no-prisoner').expect(200)

    expect(loggedEvents()[0].subject).toEqual({ subjectType: 'NOT_APPLICABLE', subjectId: undefined })
  })

  it('logs only an attempt when a request does not render a page', async () => {
    await request(appWithAuditing()).get('/prisoner/A1234BC/non-associations/missing').expect(404)

    expect(loggedEvents()).toEqual([{ subject: forPrisoner, what: 'PAGE_VIEW_ACCESS_ATTEMPT' }])
  })

  it.each([
    ['the home redirect', '/'],
    ['a prisoner photo', '/prisoner/A1234BC/photo.jpeg'],
  ])('does not audit %s', async (_name, url) => {
    await request(appWithAuditing()).get(url)

    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('does not audit when there is no signed-in user', async () => {
    await request(appWithAuditing({ user: null }))
      .get('/prisoner/A1234BC/non-associations')
      .expect(200)

    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('still serves the page when auditing fails', async () => {
    auditService.logAuditEvent.mockRejectedValue(new Error('SQS is down'))

    await request(appWithAuditing()).get('/prisoner/A1234BC/non-associations').expect(200).expect(renderedHtml)
  })

  it('passes render errors to the error handler rather than swallowing them', async () => {
    await request(appWithAuditing({ renderFails: true }))
      .get('/prisoner/A1234BC/non-associations')
      .expect(500)
  })
})
