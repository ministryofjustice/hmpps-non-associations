import { davidJones, andrewBrown } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import AddPage from '../pages/nonAssociations/add'
import AddConfirmationPage from '../pages/nonAssociations/addConfirmation'
import ListPage from '../pages/nonAssociations/list'
import PrisonerSearchPage from '../pages/nonAssociations/prisonerSearch'

context('Add non-association page', () => {
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

  it('navigate to add non-association', () => {
    listPage.addButton.click()
    cy.title().should('eq', 'Search for a prisoner')
  })

  it('should allow adding a new non-association', () => {
    cy.task('stubOffenderSearchResults', {
      prisonId: 'MDI',
      term: 'Andrew',
      results: [andrewBrown],
    })

    listPage.addButton.click()
    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)
    prisonerSearchPage.getInputField().type('Andrew')
    prisonerSearchPage.getSearchButton().click()
    prisonerSearchPage.getSelectPrisonerLink().click()

    cy.task('stubCreateNonAssociation')

    const addDetailsPage = Page.verifyOnPage(AddPage)
    addDetailsPage.radioButtonPrisonerRole.click()
    addDetailsPage.radioButtonOtherPrisonerRole.click()
    addDetailsPage.radioButtonReason.click()
    addDetailsPage.radioButtonRestrictionType.click()
    addDetailsPage.getAddCommentBox().type('Andrew is a bully')
    addDetailsPage.getSaveButton().click()

    Page.verifyOnPage(AddConfirmationPage)
  })
})
