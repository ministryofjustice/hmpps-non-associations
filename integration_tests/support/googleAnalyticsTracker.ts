export type GtagCall =
  | ['config', string, Record<string, string>?]
  | ['get', string, string, ((field: string) => void)?]
  | ['set', Record<string, string>]
  | ['event', string, Record<string, string>?]

export default class GoogleAnalyticsTracker {
  private calls: GtagCall[]

  constructor() {
    this.calls = []
  }

  clear(): void {
    while (this.calls.length) {
      this.calls.pop()
    }
  }

  trackCall(call: GtagCall): void {
    this.calls.push(call)
  }

  shouldHaveLastSent(...call: GtagCall): Cypress.Chainable<GtagCall> {
    return cy.wrap(this.calls.at(-1)).should('be.deep.equal', call)
  }
}
