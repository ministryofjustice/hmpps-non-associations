import { davidJones, fredMills } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import ListPrisonerNonAssociations from '../pages/nonAssociations/listPrisonerNonAssociations'
import UpdatePrisonerDetails from '../pages/nonAssociations/updatePrisonerDetails'
import UpdatePrisonerConfirmation from '../pages/nonAssociations/updatePrisonerConfirmation'
import ViewNonAssociation from '../pages/nonAssociations/viewNonAssociation'

context('Update prisoner non associations page', () => {
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

  it('should allow updating a non association ', () => {
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: fredMills.prisonerNumber, result: fredMills })
    cy.task('stubGetNonAssociation')

    listPage.getViewLinkForRow(0).click()
    const viewPage = Page.verifyOnPage(ViewNonAssociation, 'David Jones', 'Fred Mills')
    viewPage.updateButton.click()

    cy.task('stubUpdateNonAssociation')

    const updatePage = Page.verifyOnPage(UpdatePrisonerDetails)
    updatePage.getUpdateCommentBox().type(' and IR456456')
    updatePage.getUpdateButton().click()

    Page.verifyOnPage(UpdatePrisonerConfirmation)
  })
})
