import Page, { type PageElement } from './page'

export default class PrisonerNonAssociations extends Page {
  constructor() {
    super('Non-association details')
  }

  get form(): PageElement<HTMLFormElement> {
    return cy.get('.govuk-fieldset')
  }

  get statusRadios(): PageElement<HTMLDivElement> {
    return this.form.find('.govuk-radios__item')
  }
}
