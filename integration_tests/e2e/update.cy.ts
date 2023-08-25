import { davidJones } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import ListPage from '../pages/nonAssociations/list'
import ViewPage from '../pages/nonAssociations/view'
import UpdatePage from '../pages/nonAssociations/update'
import UpdateConfirmationPage from '../pages/nonAssociations/updateConfirmation'

context('Update prisoner non-association page', () => {
  let listPage: ListPage

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserCaseloads')
    cy.task('stubOffenderSearchGetPrisoner')
    cy.task('stubListNonAssociations')
    cy.signIn()

    cy.visit(`/prisoner/${davidJones.prisonerNumber}/non-associations`)
    listPage = Page.verifyOnPage(ListPage, 'David Jones’')
  })

  it('should allow updating a non-association', () => {
    cy.task('stubGetNonAssociation')

    listPage.getViewLinkForRow(0).click()
    const viewPage = Page.verifyOnPage(ViewPage, 'David Jones', 'Fred Mills')
    viewPage.updateButton.click()

    cy.task('stubUpdateNonAssociation')

    const updatePage = Page.verifyOnPage(UpdatePage)
    updatePage.getUpdateCommentBox().type(' and IR456456')
    updatePage.getUpdateButton().click()

    Page.verifyOnPage(UpdateConfirmationPage)
  })
})
