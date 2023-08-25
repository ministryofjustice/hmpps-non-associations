import { davidJones, andrewBrown } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import AddPrisonerSearch from '../pages/nonAssociations/addPrisonerSearch'
import AddPrisonerDetails from '../pages/nonAssociations/addPrisonerDetails'
import AddPrisonerConfirmation from '../pages/nonAssociations/addPrisonerConfirmation'
import ListPrisonerNonAssociations from '../pages/nonAssociations/listPrisonerNonAssociations'

context('Add prisoner non associations page', () => {
  let listPage: ListPrisonerNonAssociations

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserCaseloads')
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: davidJones.prisonerNumber, result: davidJones })
    cy.task('stubListNonAssociations')
    cy.signIn()

    cy.visit(`/prisoner/${davidJones.prisonerNumber}/non-associations`)
    listPage = Page.verifyOnPage(ListPrisonerNonAssociations, 'David Jones’')
  })

  it('navigate to add non association', () => {
    listPage.addButton.click()
    cy.title().should('eq', 'Search for a prisoner')
  })

  it('should allow adding a new non association', () => {
    cy.task('stubOffenderSearchResults', {
      prisonId: 'MDI',
      term: 'Andrew',
      results: [andrewBrown],
    })
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: andrewBrown.prisonerNumber, result: andrewBrown })

    listPage.addButton.click()
    const prisonerSearchPage = Page.verifyOnPage(AddPrisonerSearch)
    prisonerSearchPage.getInputField().type('Andrew')
    prisonerSearchPage.getSearchButton().click()
    prisonerSearchPage.getSelectPrisonerLink().click()

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
