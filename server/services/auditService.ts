import HmppsAuditClient, { type AuditEvent } from '../data/hmppsAuditClient'

/**
 * Identifies what an audited page was about, where that can be determined from the request.
 */
export interface PageViewSubject {
  prisonerNumber?: string
  searchTerm?: string
}

/**
 * The parts of an audit event gathered by middleware before the subject is known.
 */
export interface PageViewEvent {
  who: string
  correlationId?: string
  details?: object
}

/** HMPPS Audit rejects subject ids longer than this */
const maxSubjectIdLength = 80

export default class AuditService {
  constructor(private readonly hmppsAuditClient: HmppsAuditClient) {}

  async logAuditEvent(event: AuditEvent): Promise<void> {
    await this.hmppsAuditClient.sendMessage(event)
  }

  /**
   * Records that a user viewed a page, or attempted to.
   *
   * Attempt events are emitted for every GET – including redirects, errors and requests
   * refused by the authorisation middleware – whereas plain page views are only emitted
   * once a page has rendered successfully.
   *
   * Never throws: auditing must not be able to break page rendering.
   */
  async logPageView(pageViewEvent: PageViewEvent, subject: PageViewSubject = {}, isAttempt = false): Promise<void> {
    const event: AuditEvent = {
      ...pageViewEvent,
      ...subjectOf(subject),
      what: isAttempt ? 'PAGE_VIEW_ACCESS_ATTEMPT' : 'PAGE_VIEW',
    }
    await this.hmppsAuditClient.sendMessage(event, false)
  }
}

function subjectOf({ prisonerNumber, searchTerm }: PageViewSubject): Pick<AuditEvent, 'subjectId' | 'subjectType'> {
  if (prisonerNumber) {
    return { subjectId: prisonerNumber, subjectType: 'PRISONER_ID' }
  }
  if (searchTerm) {
    return { subjectId: searchTerm.substring(0, maxSubjectIdLength), subjectType: 'SEARCH_TERM' }
  }
  return { subjectType: 'NOT_APPLICABLE' }
}
