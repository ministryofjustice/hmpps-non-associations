import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('This site is under construction...')
  }

  fallbackHeaderUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  fallbackFooter = (): PageElement => cy.get('.govuk-footer')
}
