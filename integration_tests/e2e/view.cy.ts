import Page from '../pages/page'
import ViewPage from '../pages/nonAssociations/view'
import { davidJones, fredMills } from '../../server/data/testData/offenderSearch'

context('View non-association details page', () => {
  let viewPage: ViewPage

  beforeEach(() => {
    cy.resetBasicStubs()
    cy.navigateToDavidJonesNonAssociations().then(listPage => {
      cy.task('stubGetNonAssociation')

      listPage.getViewLinkForRow(0, 0).click()
      viewPage = Page.verifyOnPage(ViewPage, 'David Jones', 'Fred Mills')
    })
  })

  it('should show key prisoner’s details', () => {
    viewPage.miniProfileHeader.should('contain.text', 'Jones, David')
    viewPage.miniProfileHeader.should('contain.text', davidJones.prisonerNumber)
    viewPage.miniProfileHeader.should('contain.text', davidJones.cellLocation)
    viewPage.miniProfileHeader.should('contain.text', 'Perpetrator')
  })

  it('should show other prisoner’s details', () => {
    viewPage.otherPrisonerBox.should('contain.text', 'Mills, Fred')
    viewPage.otherPrisonerBox.should('contain.text', fredMills.prisonerNumber)
    viewPage.otherPrisonerBox.should('contain.text', fredMills.cellLocation)
    viewPage.otherPrisonerBox.should('contain.text', 'Victim')
    viewPage.otherPrisonerBox.should('contain.text', 'See IR 12133100')
  })

  it('shows feedback banner', () => {
    viewPage.checkFeedbackBanner()
  })

  it('has correct breadcrumb', () => {
    viewPage.checkLastBreadcrumb('Non-associations')
  })

  it('has update & close buttons when the non-association is not closed', () => {
    viewPage.updateButton.should('exist')
    viewPage.closeButton.should('exist')
  })

  it('should not show help-with-roles details box if user has write access', () => {
    viewPage.helpWithRoles.should('not.exist')
  })

  it('should show help-with-roles details box if user has read-only access', () => {
    viewPage.signOut.click()
    cy.resetBasicStubs({ roles: ['ROLE_PRISON'] })
    cy.navigateToDavidJonesNonAssociations()
    cy.task('stubGetNonAssociation')
    cy.visit(`/prisoner/${davidJones.prisonerNumber}/non-associations/101`)
    viewPage = Page.verifyOnPage(ViewPage, 'David Jones', 'Fred Mills')

    viewPage.helpWithRoles.should('contain.text', 'Need to update non-associations?')

    // opening/closing help-with-roles details box sends GA events
    cy.trackGoogleAnalyticsCalls().then(googleAnalyticsTracker => {
      viewPage.helpWithRoles.find('summary').click()
      cy.then(() => {
        googleAnalyticsTracker.shouldHaveLastSent('event', 'non_associations_event', {
          category: 'Help with roles > Opened box',
        })
      })

      viewPage.helpWithRoles.find('summary').click()
      cy.then(() => {
        googleAnalyticsTracker.shouldHaveLastSent('event', 'non_associations_event', {
          category: 'Help with roles > Closed box',
        })
      })
    })
  })
})
