import Page, { type PageElement } from '../page'

export default class updatePrisonerDetails extends Page {
  constructor() {
    super(`Non-association details`)
  }

  getUpdateCommentBox(): PageElement<HTMLElement> {
    return cy.get('#update-comment')
  }

  getUpdateButton(): PageElement<HTMLElement> {
    return cy.get('button[class="govuk-button"]')
  }
}
