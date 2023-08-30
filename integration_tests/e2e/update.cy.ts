import Page from '../pages/page'
import ListPage from '../pages/nonAssociations/list'
import ViewPage from '../pages/nonAssociations/view'
import UpdatePage from '../pages/nonAssociations/update'
import UpdateConfirmationPage from '../pages/nonAssociations/updateConfirmation'
import { resetBasicStubs, navigateToDavidJonesNonAssociations } from './index'

context('Update prisoner non-association page', () => {
  let listPage: ListPage

  beforeEach(() => {
    resetBasicStubs()
    listPage = navigateToDavidJonesNonAssociations()
  })

  it('should allow updating a non-association', () => {
    cy.task('stubGetNonAssociation')

    listPage.getViewLinkForRow(0).click()
    const viewPage = Page.verifyOnPage(ViewPage, 'David Jones', 'Fred Mills')
    viewPage.updateButton.click()

    cy.task('stubUpdateNonAssociation')

    const updatePage = Page.verifyOnPage(UpdatePage)
    updatePage.checkLastBreadcrumb('Non-associations')

    updatePage.commentBox.type(' and IR456456')
    updatePage.saveButton.click()

    Page.verifyOnPage(UpdateConfirmationPage)
  })
})
