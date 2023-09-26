import { fredMills } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import AddPage from '../pages/nonAssociations/add'
import AddConfirmationPage from '../pages/nonAssociations/addConfirmation'
import ListPage from '../pages/nonAssociations/list'
import PrisonerSearchPage from '../pages/nonAssociations/prisonerSearch'

context('Add non-association page', () => {
  let listPage: ListPage

  beforeEach(() => {
    cy.resetBasicStubs()
    cy.navigateToDavidJonesNonAssociations().then(result => {
      listPage = result
    })
  })

  it('navigate to add non-association', () => {
    listPage.addButton.click()
    cy.title().should('eq', 'Search for a prisoner – Digital Prison Services')
  })

  it('should allow adding a new non-association', () => {
    cy.task('stubOffenderSearchResults', {
      prisonId: 'MDI',
      term: 'mills',
      results: [fredMills],
    })

    listPage.addButton.click()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.checkLastBreadcrumb('Non-associations')

    prisonerSearchPage.getInputField().type('mills')
    prisonerSearchPage.getSearchButton().click()
    prisonerSearchPage.getSelectPrisonerLink().click()

    cy.task('stubCreateNonAssociation')

    const addDetailsPage = Page.verifyOnPage(AddPage)
    addDetailsPage.checkLastBreadcrumb('Non-associations')

    addDetailsPage.getRadioButtonForPrisonerRole('Perpetrator').click()
    addDetailsPage.getRadioButtonOtherPrisonerRole('Victim').click()
    addDetailsPage.getRadioButtonReason('Threat').click()
    addDetailsPage.getRadioButtonRestrictionType('Cell only').click()
    addDetailsPage.commentBox.type('David is a bully')
    addDetailsPage.saveButton.click()

    const confirmationPage = Page.verifyOnPage(AddConfirmationPage)
    confirmationPage.checkLastBreadcrumb('Non-associations')

    // Clicking on the link sends a GA event
    cy.trackGoogleAnalyticsCalls().then(googleAnalyticsTracker => {
      cy.get('a[data-ga-category]').click()
      cy.then(() => {
        googleAnalyticsTracker.shouldHaveLastSent('event', 'non_associations_event', {
          category: 'Add confirmation > Clicked on key prisoner link',
          action: null,
          label: null,
        })
      })
    })
  })
})
