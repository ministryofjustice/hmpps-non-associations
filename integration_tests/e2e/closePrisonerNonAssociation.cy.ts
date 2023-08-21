import { davidJones } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import PrisonerNonAssociations from '../pages/prisonerNonAssociations'
import NonAssociationsPage from '../pages/nonAssociations/nonAssociations'

context('Prisoner non associations', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserCaseloads')
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: 'A1234BC', result: davidJones })
    cy.task('stubListNonAssociations')
    cy.signIn()
    cy.visit('/prisoner/A1234BC/non-associations')
  })

  it('navigate to close a non association ', () => {
    const homePage = Page.verifyOnPage(PrisonerNonAssociations)
    homePage.getCloseNonAssociation().click()
    // cy.title().should('eq', `Close non-association`)
  })
})
