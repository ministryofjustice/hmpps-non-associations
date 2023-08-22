import { davidJones } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import PrisonerNonAssociations from '../pages/nonAssociations/prisonerNonAssociations'

context('Prisoner non associations Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserCaseloads')
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: 'A1234BC', result: davidJones })
    cy.task('stubListNonAssociations')
    cy.signIn()
    cy.visit('/prisoner/A1234BC/non-associations')
  })
  it('has correct title', () => {
    cy.title().should('eq', `David Jones’ non-associations`)
  })

  it('has correct breadcrumb', () => {
    const homePage = Page.verifyOnPage(PrisonerNonAssociations)
    homePage.checkLastBreadcrumb('Jones, David')
  })

  it('should display the closed tab', () => {
    const homePage = Page.verifyOnPage(PrisonerNonAssociations)
    homePage.getClosedNonAssociations().click()
    homePage
      .getClosedNonAssociationsParent()
      .should('have.class', 'govuk-tabs__list-item govuk-tabs__list-item--selected')
  })
})
