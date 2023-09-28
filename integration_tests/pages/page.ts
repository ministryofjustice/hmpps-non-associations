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

  get feedbackBanner(): PageElement<HTMLDivElement> {
    return cy.get('aside.app-feedback-banner')
  }

  checkFeedbackBanner(): void {
    this.feedbackBanner.should('exist').should('contain.text', 'Help improve it by telling us what you think')
  }

  get breadcrumbs(): PageElement<HTMLDivElement> {
    return cy.get('.govuk-breadcrumbs__list-item')
  }

  checkLastBreadcrumb(label: string): void {
    this.breadcrumbs.last().should('contain.text', label)
    this.breadcrumbs.last().find('a').should('have.attr', 'href')
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

  get footer(): PageElement {
    return cy.get('footer.govuk-footer')
  }

  get footerLinks(): PageElement<HTMLLIElement> {
    return this.footer.find('li.govuk-footer__inline-list-item')
  }
}
