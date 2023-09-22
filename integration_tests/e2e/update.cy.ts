import Page from '../pages/page'
import ListPage from '../pages/nonAssociations/list'
import ViewPage from '../pages/nonAssociations/view'
import UpdatePage from '../pages/nonAssociations/update'
import UpdateConfirmationPage from '../pages/nonAssociations/updateConfirmation'

context('Update prisoner non-association page', () => {
  let listPage: ListPage

  beforeEach(() => {
    cy.resetBasicStubs()
    cy.navigateToDavidJonesNonAssociations().then(result => {
      listPage = result
    })
  })

  it('should allow updating a non-association', () => {
    cy.task('stubGetNonAssociation')

    listPage.getViewLinkForRow(0, 0).click()
    const viewPage = Page.verifyOnPage(ViewPage, 'David Jones', 'Fred Mills')
    viewPage.updateButton.click()

    cy.task('stubUpdateNonAssociation')

    const updatePage = Page.verifyOnPage(UpdatePage)
    updatePage.checkLastBreadcrumb('Non-associations')

    updatePage.commentBox.type(' and IR456456')
    updatePage.saveButton.click()

    Page.verifyOnPage(UpdateConfirmationPage)

    // Clicking on the link sends a GA event
    cy.trackGoogleAnalyticsCalls().then(googleAnalyticsTracker => {
      cy.get('a[data-ga-category]').click()
      cy.then(() => {
        googleAnalyticsTracker.shouldHaveLastSent('event', 'non_associations_event', {
          category: 'Update confirmation > Clicked on key prisoner link',
          action: null,
          label: null,
        })
      })
    })
  })
})
