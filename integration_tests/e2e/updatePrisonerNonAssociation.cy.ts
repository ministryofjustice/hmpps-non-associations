import { davidJones, andrewBrown } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import ViewPrisonerNonAssociations from '../pages/nonAssociations/viewPrisonerNonAssociations'
import UpdatePrisonerDetails from '../pages/nonAssociations/updatePrisonerDetails'
import UpdatePrisonerConfirmation from '../pages/nonAssociations/updatePrisonerConfirmation'

context('Update prisoner non associations page', () => {
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
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: 'A5678CS', result: andrewBrown })
    cy.task('stubGetNonAssociationToUpdate')

    const updatePage = Page.verifyOnPage(ViewPrisonerNonAssociations)
    updatePage.getUpdateNonAssociation().click()
    cy.task('stubUpdateNonAssociation')

    const closePage = Page.verifyOnPage(UpdatePrisonerDetails)
    closePage.getUpdateCommentBox().type(' and IR456456')
    closePage.getUpdateButton().click()

    Page.verifyOnPage(UpdatePrisonerConfirmation)
  })
})
