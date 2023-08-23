import Page, { type PageElement } from '../page'

export default class ClosePrisonerDetails extends Page {
  constructor() {
    super('Close a non-association')
  }

  getCloseCommentBox(): PageElement<HTMLElement> {
    return cy.get('#close-closedReason')
  }

  getCloseButton(): PageElement<HTMLElement> {
    return cy.get('button[class="govuk-button"]')
  }
}
