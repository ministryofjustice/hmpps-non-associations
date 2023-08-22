import Page, { type PageElement } from '../page'

export default class PrisonerNonAssociations extends Page {
  constructor() {
    super(`Close a non-association`)
  }

  getCloseCommentBox(): PageElement<HTMLElement> {
    return cy.get('#close-closureReason')
  }

  getCloseButton(): PageElement<HTMLElement> {
    return cy.get('button[class="govuk-button"]')
  }
}
