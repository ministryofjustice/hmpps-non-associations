import { davidJones, fredMills } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import ClosePrisonerDetails from '../pages/nonAssociations/closePrisonerDetails'
import ClosePrisonerConfirmation from '../pages/nonAssociations/closePrisonerConfirmation'
import ListPrisonerNonAssociations from '../pages/nonAssociations/listPrisonerNonAssociations'

context('Close prisoner non associations page', () => {
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

  it('should allow closing a non association ', () => {
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: 'A1235EF', result: fredMills })
    cy.task('stubGetNonAssociationForClose')

    const homePage = Page.verifyOnPage(ListPrisonerNonAssociations)
    homePage.getCloseNonAssociation().click()
    cy.task('stubCloseNonAssociation')

    const closePage = Page.verifyOnPage(ClosePrisonerDetails)
    closePage.getCloseCommentBox().type('They are now friends')
    closePage.getCloseButton().click()

    Page.verifyOnPage(ClosePrisonerConfirmation)
  })
})
