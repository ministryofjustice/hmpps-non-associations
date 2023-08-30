import { davidJones } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import ListPage from '../pages/nonAssociations/list'

/**
 * Set up stubs needed for all interactions
 */
export function resetBasicStubs(): void {
  cy.task('reset')
  cy.task('stubSignIn')
  cy.task('stubAuthUser')
  cy.task('stubNomisUserCaseloads')
}

/**
 * Set up stubs needed for listing non-associations for David Jones
 * and navigate to list page
 */
export function navigateToDavidJonesNonAssociations(): ListPage {
  cy.signIn()

  cy.task('stubPrisonApiGetPhoto')
  cy.task('stubPrisonApiGetStaffDetails')
  cy.task('stubOffenderSearchGetPrisoner')
  cy.task('stubListNonAssociations')

  cy.visit(`/prisoner/${davidJones.prisonerNumber}/non-associations`)
  return Page.verifyOnPage(ListPage, 'David Jones’')
}
