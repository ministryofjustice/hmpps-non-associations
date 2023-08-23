import { davidJones, andrewBrown } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import AddPrisonerSearch from '../pages/nonAssociations/addPrisonerSearch'
import AddPrisonerDetails from '../pages/nonAssociations/addPrisonerDetails'
import AddPrisonerConfirmation from '../pages/nonAssociations/addPrisonerConfirmation'
import ListPrisonerNonAssociations from '../pages/nonAssociations/listPrisonerNonAssociations'

context('Add prisoner non associations page', () => {
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
    const homePage = Page.verifyOnPage(ListPrisonerNonAssociations)
    homePage.getAddNewNonAssociation().click()
    cy.title().should('eq', `Search for a prisoner`)
  })

  it('should allow adding a new non association', () => {
    cy.task('stubOffenderSearchResults', {
      prisonId: 'MDI',
      term: 'Andrew',
      results: [andrewBrown],
    })

    const homePage = Page.verifyOnPage(ListPrisonerNonAssociations)
    homePage.getAddNewNonAssociation().click()
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: 'A5678CS', result: andrewBrown })

    const addPage = Page.verifyOnPage(AddPrisonerSearch)
    addPage.getInputField().type('Andrew')
    addPage.getSearchButton().click()
    addPage.getSelectPrisonerLink().click()

    cy.task('stubCreateNonAssociation')
    const addDetailsPage = Page.verifyOnPage(AddPrisonerDetails)
    addDetailsPage.radioButtonPrisonerRole.click()
    addDetailsPage.radioButtonOtherPrisonerRole.click()
    addDetailsPage.radioButtonReason.click()
    addDetailsPage.radioButtonRestrictionType.click()
    addDetailsPage.getAddCommentBox().type('Andrew is a bully')
    addDetailsPage.getSaveButton().click()

    Page.verifyOnPage(AddPrisonerConfirmation)
  })
})
