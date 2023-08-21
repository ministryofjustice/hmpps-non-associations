import { davidJones, andrewBrown } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import PrisonerNonAssociations from '../pages/prisonerNonAssociations'
import addPrisonerNonAssociations from '../pages/addPrisonerNonAssociations'
import addPrisonerNonAssociationDetails from '../pages/addPrisonerNonAssociationDetails'

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

  it('navigate to add non association', () => {
    const homePage = Page.verifyOnPage(PrisonerNonAssociations)
    homePage.getAddNewNonAssociation().click()
    cy.title().should('eq', `Search for a prisoner`)
  })

  it('add a new non association', () => {
    cy.task('stubOffenderSearchResults', {
      prisonId: 'MDI',
      term: 'Andrew',
      results: [andrewBrown],
    })
    const homePage = Page.verifyOnPage(PrisonerNonAssociations)
    homePage.getAddNewNonAssociation().click()

    const addPage = Page.verifyOnPage(addPrisonerNonAssociations)
    addPage.getInputField('search').type('Andrew')
    addPage.getSearchButton().click()
    addPage.getSelectPrisonerLink().click()
    // const addDetailsPage = Page.verifyOnPage(addPrisonerNonAssociationDetails)x
    // addDetailsPage.form.submit()
  })
})
