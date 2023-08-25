import { davidJones, fredMills } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import ClosePrisonerDetails from '../pages/nonAssociations/closePrisonerDetails'
import ClosePrisonerConfirmation from '../pages/nonAssociations/closePrisonerConfirmation'
import ListPrisonerNonAssociations from '../pages/nonAssociations/listPrisonerNonAssociations'
import ViewNonAssociation from '../pages/nonAssociations/viewNonAssociation'

context('Close prisoner non associations page', () => {
  let listPage: ListPrisonerNonAssociations

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserCaseloads')
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: davidJones.prisonerNumber, result: davidJones })
    cy.task('stubListNonAssociations')
    cy.signIn()

    cy.visit(`/prisoner/${davidJones.prisonerNumber}/non-associations`)
    listPage = Page.verifyOnPage(ListPrisonerNonAssociations, 'David Jones’')
  })

  it('should allow closing a non association ', () => {
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: fredMills.prisonerNumber, result: fredMills })
    cy.task('stubGetNonAssociation')

    listPage.getViewLinkForRow(0).click()
    const viewPage = Page.verifyOnPage(ViewNonAssociation, 'David Jones', 'Fred Mills')
    viewPage.closeButton.click()

    cy.task('stubCloseNonAssociation')

    const closePage = Page.verifyOnPage(ClosePrisonerDetails)
    closePage.getCloseCommentBox().type('They are now friends')
    closePage.getCloseButton().click()

    Page.verifyOnPage(ClosePrisonerConfirmation)
  })
})
