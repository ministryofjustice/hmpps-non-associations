import Page from '../pages/page'
import ClosePage from '../pages/nonAssociations/close'
import CloseConfirmationPage from '../pages/nonAssociations/closeConfirmation'
import ListPage from '../pages/nonAssociations/list'
import ViewPage from '../pages/nonAssociations/view'

context('Close prisoner non-association page', () => {
  let listPage: ListPage

  beforeEach(() => {
    cy.resetBasicStubs()
    cy.navigateToDavidJonesNonAssociations().then(result => {
      listPage = result
    })
  })

  it('should allow closing a non-association', () => {
    cy.task('stubGetNonAssociation')

    listPage.getViewLinkForRow(0).click()
    const viewPage = Page.verifyOnPage(ViewPage, 'David Jones', 'Fred Mills')
    viewPage.closeButton.click()

    cy.task('stubCloseNonAssociation')

    const closePage = Page.verifyOnPage(ClosePage)
    closePage.checkLastBreadcrumb('Non-associations')

    closePage.getCloseCommentBox().type('They are now friends')
    closePage.getCloseButton().click()

    Page.verifyOnPage(CloseConfirmationPage)
  })
})
