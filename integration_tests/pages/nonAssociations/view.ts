import Page, { type PageElement } from '../page'

export default class ViewPage extends Page {
  constructor(
    private readonly prisonerName: string,
    private readonly otherPrisonerName: string,
  ) {
    super(`Non-association: ${prisonerName} and ${otherPrisonerName}`)
  }

  get updateButton(): PageElement<HTMLAnchorElement> {
    return cy.get('.govuk-button').contains<HTMLAnchorElement>('Update')
  }

  get closeButton(): PageElement<HTMLAnchorElement> {
    return cy.get('.govuk-button').contains<HTMLAnchorElement>('Close')
  }
}
