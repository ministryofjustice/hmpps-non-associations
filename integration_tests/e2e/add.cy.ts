import { mockNonAssociation } from '../../server/data/testData/nonAssociationsApi'
import { davidJones, fredMills, joePeters, maxClarke, walterSmith } from '../../server/data/testData/offenderSearch'
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
    cy.task('stubOffenderSearchResultsInPrison', {
      prisonId: 'MDI',
      term: 'mills',
      results: [fredMills],
    })
    cy.task('stubListNonAssociationsBetween', {
      prisonerNumbers: [davidJones.prisonerNumber, fredMills.prisonerNumber],
    })

    listPage.addButton.click()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.checkFeedbackBanner()
    prisonerSearchPage.checkLastBreadcrumb('Non-associations')

    prisonerSearchPage.scopeRadioButtons.should('have.length', 2)
    prisonerSearchPage.inputField.type('mills')
    prisonerSearchPage.searchButton.click()

    prisonerSearchPage.getTableHeaderSortingLink(3).should('contain.text', 'Location')
    prisonerSearchPage.getTableHeaderSortingLink(3).click()

    prisonerSearchPage.tableHeader.spread((...th) => {
      expect(th[1].attributes.getNamedItem('aria-sort').value).to.equal('none')
      expect(th[3].attributes.getNamedItem('aria-sort').value).to.equal('ascending')
    })
    prisonerSearchPage.tableRowContents.then(rows => {
      expect(rows).to.have.length(1)
      const [fredMillsRow] = rows

      expect(fredMillsRow[1]).to.contain('Mills, Fred')
      expect(fredMillsRow[2]).to.contain(fredMills.prisonerNumber)
      expect(fredMillsRow[3]).to.contain('1-1-002')
      expect(fredMillsRow[4]).to.contain('Moorland')
      expect(fredMillsRow[5]).to.contain('Select prisoner')
    })

    prisonerSearchPage.getSelectLinkForRow(0).click()

    cy.task('stubCreateNonAssociation')

    const addDetailsPage = Page.verifyOnPage(AddPage)
    addDetailsPage.checkFeedbackBanner()
    addDetailsPage.checkLastBreadcrumb('Non-associations')

    addDetailsPage.getRadioButtonForPrisonerRole('Perpetrator').click()
    addDetailsPage.getRadioButtonOtherPrisonerRole('Victim').click()
    addDetailsPage.getRadioButtonReason('Threat').click()
    addDetailsPage.getRadioButtonRestrictionType('Cell only').click()
    addDetailsPage.commentBox.type('David is a bully')
    addDetailsPage.saveButton.click()

    const confirmationPage = Page.verifyOnPage(AddConfirmationPage)
    confirmationPage.checkFeedbackBanner()
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

  it('should display correct location information for people being transferred or outside prison', () => {
    cy.task('stubOffenderSearchResultsGlobally', {
      results: [fredMills, walterSmith, maxClarke, joePeters],
    })
    cy.task('stubListNonAssociationsBetween', {
      prisonerNumbers: [
        davidJones.prisonerNumber,
        fredMills.prisonerNumber,
        walterSmith.prisonerNumber,
        maxClarke.prisonerNumber,
        joePeters.prisonerNumber,
      ],
      nonAssociations: [mockNonAssociation(maxClarke.prisonerNumber, davidJones.prisonerNumber)],
    })

    listPage.addButton.click()

    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.scopeRadioButtons.eq(1).click()
    prisonerSearchPage.inputField.type('something')
    prisonerSearchPage.searchButton.click()

    prisonerSearchPage.getTableHeaderSortingLink(3).should('not.exist')

    prisonerSearchPage.tableRowContents.then(rows => {
      expect(rows).to.have.length(4)
      const [fredMillsRow, walterSmithRow, maxClarkeRow, joePetersRow] = rows

      expect(fredMillsRow[1]).to.contain('Mills, Fred')
      expect(fredMillsRow[3]).to.contain('1-1-002')
      expect(fredMillsRow[4]).to.contain('Moorland')
      expect(fredMillsRow[5]).to.contain('Select prisoner')

      expect(walterSmithRow[1]).to.contain('Smith, Walter')
      expect(walterSmithRow[3]).to.contain('2-4-002')
      expect(walterSmithRow[4]).to.contain('Brixton')
      expect(walterSmithRow[5]).to.contain('Select prisoner')

      expect(maxClarkeRow[1]).to.contain('Clarke, Max')
      expect(maxClarkeRow[3]).to.contain('Transfer')
      expect(maxClarkeRow[4]).to.contain('N/A')
      expect(maxClarkeRow[5]).to.contain('View non-association')

      expect(joePetersRow[1]).to.contain('Peters, Joe')
      expect(joePetersRow[3]).to.contain('N/A')
      expect(joePetersRow[4]).to.contain('Outside')
      expect(joePetersRow[5]).to.contain('Select prisoner')
    })
  })
})
