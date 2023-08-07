import type { UserRole } from '../../server/data/hmppsAuthClient'

// TODO: Add imports
import { sampleOffenderSearchResults } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import PrisonerNonAssociations from '../pages/prisonerNonAssociations'
import NonAssociationsPage from '../pages/nonAssociations/nonAssociations'

context('Prisoner non associations', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserCaseloads')
  })

  // TODO: Add tests
  it('shows non-associations for the prisoner in context', () => {
    cy.signIn()
    cy.visit('/prisoner/A1235EF/non-associations')
    const homePage = Page.verifyOnPage(PrisonerNonAssociations)
    homePage.manageDetails.click()

    const listPage = Page.verifyOnPage(NonAssociationsPage)
    // listPage.checkLastBreadcrumb('Digital Prison Services', '/')

    listPage.contentsOfTable.should('deep.equal', 'Open', 'Closed')
    Page.verifyOnPage(NonAssociationsPage)
  })
})
