import { davidJones } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import ListPage from '../pages/nonAssociations/list'
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

Cypress.Commands.add('resetBasicStubs', () => {
  cy.task('reset')
  cy.task('stubSignIn')
  cy.task('stubAuthUser')
  cy.task('stubNomisUserCaseloads')
})

Cypress.Commands.add('navigateToDavidJonesNonAssociations', () => {
  cy.signIn()

  cy.task('stubPrisonApiGetPhoto')
  cy.task('stubPrisonApiGetStaffDetails')
  cy.task('stubOffenderSearchGetPrisoner')
  cy.task('stubListNonAssociations')

  cy.visit(`/prisoner/${davidJones.prisonerNumber}/non-associations`)
  const listPage = Page.verifyOnPage(ListPage, 'David Jones’')

  return cy.wrap(listPage)
})
