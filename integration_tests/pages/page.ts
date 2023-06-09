export type PageElement<TElement = HTMLElement> = Cypress.Chainable<JQuery<TElement>>

export default abstract class Page {
  static verifyOnPage<T extends Page>(constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    return new constructor(...args)
  }

  constructor(protected readonly title: string) {
    this.checkOnPage()
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  get headerUserName(): PageElement<HTMLSpanElement> {
    return cy.get('[data-qa=header-user-name]')
  }

  get signOut(): PageElement<HTMLAnchorElement> {
    return cy.get('[data-qa=signOut]')
  }

  get manageDetails(): PageElement<HTMLAnchorElement> {
    return cy.get('[data-qa=manageDetails]')
  }

  get activeCaseload(): PageElement<HTMLSpanElement> {
    return cy.get('[data-test=active-location]')
  }

  get breadcrumbs(): PageElement<HTMLDivElement> {
    return cy.get('.govuk-breadcrumbs__list-item')
  }

  checkLastBreadcrumb() {
    cy.url().then(location => {
      const url = new URL(location)
      this.breadcrumbs.last().should('contain.text', this.title)
      this.breadcrumbs.last().find('a').should('have.attr', 'href', url.pathname)
    })
  }

  get messages(): PageElement<HTMLDivElement> {
    return cy.get('.moj-banner')
  }

  get errorSummary(): PageElement<HTMLDivElement> {
    return cy.get('.govuk-error-summary')
  }

  get errorSummaryTitle(): PageElement<HTMLHeadingElement> {
    return this.errorSummary.find('.govuk-error-summary__title')
  }

  get errorSummaryItems(): PageElement<HTMLLIElement> {
    return this.errorSummary.find('.govuk-error-summary__list li')
  }

  get footerLinks(): PageElement<HTMLLIElement> {
    return cy.get('footer.govuk-footer .govuk-footer__inline-list li')
  }
}
