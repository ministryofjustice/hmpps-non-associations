import Page, { type PageElement } from '../page'

export default class AddPage extends Page {
  constructor() {
    super('Non-association details')
  }

  get form(): PageElement<HTMLFormElement> {
    return cy.get('.govuk-fieldset')
  }

  get radioButtonPrisonerRole(): PageElement<HTMLElement> {
    return cy.get('#prisonerRole')
  }

  get radioButtonOtherPrisonerRole(): PageElement<HTMLElement> {
    return cy.get('#otherPrisonerRole-2')
  }

  get radioButtonReason(): PageElement<HTMLElement> {
    return cy.get('#reason')
  }

  get radioButtonRestrictionType(): PageElement<HTMLElement> {
    return cy.get('#restrictionType')
  }

  getAddCommentBox(): PageElement<HTMLElement> {
    return cy.get('#add-comment')
  }

  getSaveButton(): PageElement<HTMLElement> {
    return cy.get('button[class="govuk-button"]')
  }
}
