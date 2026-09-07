import HmppsAuditClient from '../data/hmppsAuditClient'
import AuditService from './auditService'

jest.mock('../data/hmppsAuditClient')

describe('Audit service', () => {
  let hmppsAuditClient: jest.Mocked<HmppsAuditClient>
  let auditService: AuditService

  beforeEach(() => {
    hmppsAuditClient = new HmppsAuditClient(null) as jest.Mocked<HmppsAuditClient>
    auditService = new AuditService(hmppsAuditClient)
  })

  describe('logAuditEvent', () => {
    it('sends audit message using audit client', async () => {
      await auditService.logAuditEvent({
        what: 'AUDIT_EVENT',
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'exampleType',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith({
        what: 'AUDIT_EVENT',
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'exampleType',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })
    })
  })

  describe('logPageView', () => {
    const pageViewEvent = {
      who: 'user1',
      correlationId: 'request123',
      details: { pageUrl: '/prisoner/A1234BC/non-associations' },
    }

    it('records the prisoner as the subject when the page is about one', async () => {
      await auditService.logPageView(pageViewEvent, { prisonerNumber: 'A1234BC' })

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith(
        {
          ...pageViewEvent,
          what: 'PAGE_VIEW',
          subjectId: 'A1234BC',
          subjectType: 'PRISONER_ID',
        },
        false,
      )
    })

    it('marks attempts differently from successful page views', async () => {
      await auditService.logPageView(pageViewEvent, { prisonerNumber: 'A1234BC' }, true)

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ what: 'PAGE_VIEW_ACCESS_ATTEMPT' }),
        false,
      )
    })

    it('records the search term as the subject when there is no prisoner', async () => {
      await auditService.logPageView(pageViewEvent, { searchTerm: 'Jones' })

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ subjectId: 'Jones', subjectType: 'SEARCH_TERM' }),
        false,
      )
    })

    it('prefers the prisoner over the search term', async () => {
      await auditService.logPageView(pageViewEvent, { prisonerNumber: 'A1234BC', searchTerm: 'Jones' })

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ subjectId: 'A1234BC', subjectType: 'PRISONER_ID' }),
        false,
      )
    })

    it('has no subject when the page is about neither', async () => {
      await auditService.logPageView(pageViewEvent)

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ subjectType: 'NOT_APPLICABLE' }),
        false,
      )
      expect(hmppsAuditClient.sendMessage.mock.calls[0][0]).not.toHaveProperty('subjectId')
    })

    it('truncates over-long search terms to 80 characters', async () => {
      await auditService.logPageView(pageViewEvent, { searchTerm: 'a'.repeat(150) })

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ subjectId: 'a'.repeat(80), subjectType: 'SEARCH_TERM' }),
        false,
      )
    })

    it('asks the client not to throw so that auditing cannot break a page', async () => {
      await auditService.logPageView(pageViewEvent)

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith(expect.anything(), false)
    })
  })
})
