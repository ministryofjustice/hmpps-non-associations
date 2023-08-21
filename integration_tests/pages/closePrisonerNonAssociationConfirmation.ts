import Page, { type PageElement } from './page'

export default class PrisonerNonAssociations extends Page {
  constructor() {
    super(`The non-association has been closed`)
  }

  getInputField(name: string): PageElement<HTMLInputElement> {
    return cy.get('#search-q')
  }

  getSearchButton(): PageElement<HTMLElement> {
    return cy.get('button[class="govuk-button"]')
  }

  getSelectPrisonerLink(): PageElement<HTMLElement> {
    return cy.contains('a', 'Select prisoner')
  }
}
