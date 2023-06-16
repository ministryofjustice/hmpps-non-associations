import GoogleAnalyticsTracker, { type GtagCall } from './googleAnalyticsTracker'

Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }): Cypress.Chainable<Cypress.AUTWindow> => {
  cy.request('/')
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
})

Cypress.Commands.add('trackGoogleAnalyticsCalls', (): Cypress.Chainable<GoogleAnalyticsTracker> => {
  const tracker = new GoogleAnalyticsTracker()
  cy.window().then(win => {
    // eslint-disable-next-line no-param-reassign
    win.gtag = (...args: GtagCall) => {
      tracker.trackCall(args)
    }
  })
  return cy.wrap(tracker)
})
