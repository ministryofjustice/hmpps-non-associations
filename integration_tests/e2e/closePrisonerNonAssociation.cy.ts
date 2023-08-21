import { davidJones, fredMills } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import PrisonerNonAssociations from '../pages/prisonerNonAssociations'
import ClosePrisonerNonAssociation from '../pages/closePrisonerNonAssociation'
import ClosePrisonerNonAssociationConfirmation from '../pages/closePrisonerNonAssociationConfirmation'

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
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: 'A1235EF', result: fredMills })
    cy.task('stubGetNonAssociation')
    const homePage = Page.verifyOnPage(PrisonerNonAssociations)
    homePage.getCloseNonAssociation().click()
    cy.task('stubCloseNonAssociation')
    const closePage = Page.verifyOnPage(ClosePrisonerNonAssociation)
    closePage.getCloseCommentBox().type('They are now friends')
    closePage.getCloseButton().click()

    Page.verifyOnPage(ClosePrisonerNonAssociationConfirmation)
  })
})
