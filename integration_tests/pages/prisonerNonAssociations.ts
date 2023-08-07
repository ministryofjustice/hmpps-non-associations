import Page, { type PageElement } from './page'

export default class PrisonerNonAssociations extends Page {
  constructor() {
    super(`Non-associations`)
  }

  getNonAssociationsTable(): PageElement<HTMLTableElement> {
    return cy.get('.govuk-table')
  }

  getPrisonerName(): PageElement<HTMLTableCellElement> {
    return cy.get('a[data-ga-action="prisoner name"]')
  }

  get createLink(): PageElement<HTMLAnchorElement> {
    return cy.get('a:contains(Create)')
  }
}
