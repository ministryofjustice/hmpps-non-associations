import Page, { type PageElement } from '../page'

export default class AddPrisonerSearch extends Page {
  constructor() {
    super(`Search for a prisoner`)
  }

  getInputField(): PageElement<HTMLInputElement> {
    return cy.get('#search-q')
  }

  getSearchButton(): PageElement<HTMLElement> {
    return cy.get('button[class="govuk-button"]')
  }

  getSelectPrisonerLink(): PageElement<HTMLElement> {
    return cy.contains('a', 'Select prisoner')
  }
}
