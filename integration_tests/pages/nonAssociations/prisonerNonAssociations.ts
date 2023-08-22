import Page, { type PageElement } from '../page'

export default class PrisonerNonAssociations extends Page {
  constructor() {
    super(`David Jones’ non-associations`)
  }

  getClosedNonAssociations(): PageElement<HTMLElement> {
    return cy.contains('Closed')
  }

  getClosedNonAssociationsParent(): PageElement<HTMLElement> {
    return cy.get('.govuk-tabs__list-item').eq(1)
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
