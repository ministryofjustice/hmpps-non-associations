import Page, { type PageElement } from '../page'

export default class ClosePage extends Page {
  constructor() {
    super('Close a non-association')
  }

  get closeCommentBox(): PageElement<HTMLTextAreaElement> {
    return cy.get('textarea#close-closedReason')
  }

  get closeButton(): PageElement<HTMLButtonElement> {
    return cy.get('button[class="govuk-button"]')
  }
}
