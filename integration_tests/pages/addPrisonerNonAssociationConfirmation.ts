import Page, { type PageElement } from './page'

export default class addPrisonerNonAssociationConfirmation extends Page {
  constructor() {
    super(`The non-association has been added`)
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
