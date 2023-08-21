import Page, { type PageElement } from './page'

export default class PrisonerNonAssociations extends Page {
  constructor() {
    super(`David Jones’ non-associations`)
  }

  getClosedNonAssociations(): PageElement<HTMLElement> {
    return cy.contains('Closed')
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

  getAlphabeticallySortedNonAssociations(): PageElement<HTMLElement> {
    return cy.contains('Prisoner details')
  }

  getAddNewNonAssociation(): PageElement<HTMLElement> {
    return cy.contains('Add new non-association')
  }

  getCloseNonAssociation(): PageElement<HTMLElement> {
    return cy.get('a:contains(Close)').eq(1)
  }
}
