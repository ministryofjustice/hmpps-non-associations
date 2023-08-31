declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to signIn. Set failOnStatusCode to false if you expect and non 200 return code
     * @example cy.signIn({ failOnStatusCode: boolean })
     */
    signIn(options?: { failOnStatusCode: boolean }): Chainable<AUTWindow>

    /**
     * Installs a spy to track calls to global `gtag()`
     */
    trackGoogleAnalyticsCalls(): Chainable<GoogleAnalyticsTracker>

    /**
     * Set up stubs needed for all interactions
     */
    resetBasicStubs(): Chainable<AUTWindow>

    /**
     * Set up stubs needed for listing non-associations for David Jones
     * and navigate to list page
     */
    navigateToDavidJonesNonAssociations(): Chainable<ListPage>
  }

  /**
   * Declare globals
   */
  interface ApplicationWindow {
    /** Google Analytics version 4 */
    gtag?: (...args: GtagCall) => void
  }
}
