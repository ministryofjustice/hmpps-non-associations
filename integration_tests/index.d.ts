declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to signIn. Set failOnStatusCode to false if you expect and non 200 return code
     * @example cy.signIn({ failOnStatusCode: boolean })
     */
    signIn(options?: { failOnStatusCode: boolean }): Chainable<AUTWindow>

    trackGoogleAnalyticsCalls(): Chainable<GoogleAnalyticsTracker>
  }

  /**
   * Declare globals
   */
  interface ApplicationWindow {
    /** Google Analytics version 4 */
    gtag?: (...args: GtagCall) => void
  }
}
