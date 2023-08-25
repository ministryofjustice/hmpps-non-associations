import { davidJones } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import ListPage from '../pages/nonAssociations/list'

context('List non-associations page', () => {
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

  it('has correct title', () => {
    cy.title().should('eq', `David Jones’ non-associations`)
  })

  it('has correct breadcrumb', () => {
    listPage.checkLastBreadcrumb('Jones, David')
  })

  it('has add button', () => {
    listPage.addButton.should('exist')
  })

  it('should have open tab selected', () => {
    listPage.openTab.should('have.class', 'govuk-tabs__list-item--selected')
  })

  it('should display the closed tab', () => {
    listPage.closedTab.should('not.have.class', 'govuk-tabs__list-item--selected')
    listPage.closedTab.find('a').click()
    listPage.closedTab.should('have.class', 'govuk-tabs__list-item--selected')
  })
})
