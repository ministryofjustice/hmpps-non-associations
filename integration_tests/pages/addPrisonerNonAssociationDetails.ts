import Page, { type PageElement } from './page'

export default class PrisonerNonAssociations extends Page {
  constructor() {
    super('Non-association details')
  }

  get form(): PageElement<HTMLFormElement> {
    return cy.get('.govuk-fieldset')
  }

  get RadioButtonPrisonerRole(): PageElement<HTMLElement> {
    return cy.get('#prisonerRole')
  }

  get RadioButtonOtherPrisonerRole(): PageElement<HTMLElement> {
    return cy.get('#otherPrisonerRole-2')
  }

  get RadioButtonReason(): PageElement<HTMLElement> {
    return cy.get('#reason')
  }

  get RadioButtonRestrictionType(): PageElement<HTMLElement> {
    return cy.get('#restrictionType')
  }

  getAddCommentBox(): PageElement<HTMLElement> {
    return cy.get('#add-comment')
  }

  getSaveButton(): PageElement<HTMLElement> {
    return cy.get('button[class="govuk-button"]')
  }
}
