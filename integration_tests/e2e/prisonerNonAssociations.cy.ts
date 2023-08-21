import { davidJones } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import PrisonerNonAssociations from '../pages/prisonerNonAssociations'
import NonAssociationsPage from '../pages/nonAssociations/nonAssociations'

context('Prisoner non associations', () => {
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

  // TODO: These need assertign
  it('has correct title', () => {
    cy.title().should('eq', `David Jones’ non-associations`)
  })

  it('users can see non-associations for the prisoner in context', () => {
    const homePage = Page.verifyOnPage(PrisonerNonAssociations)
    // homePage.checkLastBreadcrumb('Jones, David')
  })

  it('users can view closed tab', () => {
    const homePage = Page.verifyOnPage(PrisonerNonAssociations)
    homePage.getClosedNonAssociations().click()
    homePage.getClosedNonAssociations().should('contain.text', 'Closed')
  })

  // TODO: This isn't sorting so need to investigate
  it('users can sort by name', () => {
    const homePage = Page.verifyOnPage(PrisonerNonAssociations)
    homePage.getAlphabeticallySortedNonAssociations().click()
    homePage.getAlphabeticallySortedNonAssociations().should('have.attr', 'aria-sort', 'descending')
  })
})
