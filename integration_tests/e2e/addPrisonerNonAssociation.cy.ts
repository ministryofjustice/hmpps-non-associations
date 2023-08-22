import { davidJones, andrewBrown } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import ViewPrisonerNonAssociations from '../pages/nonAssociations/viewPrisonerNonAssociations'
import addPrisonerSearch from '../pages/nonAssociations/addPrisonerSearch'
import addPrisonerDetails from '../pages/nonAssociations/addPrisonerDetails'
import addPrisonerConfirmation from '../pages/nonAssociations/addPrisonerConfirmation'

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
    const homePage = Page.verifyOnPage(ViewPrisonerNonAssociations)
    homePage.getAddNewNonAssociation().click()
    cy.title().should('eq', `Search for a prisoner`)
  })

  it('should allow adding a new non association', () => {
    cy.task('stubOffenderSearchResults', {
      prisonId: 'MDI',
      term: 'Andrew',
      results: [andrewBrown],
    })

    const homePage = Page.verifyOnPage(ViewPrisonerNonAssociations)
    homePage.getAddNewNonAssociation().click()
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: 'A5678CS', result: andrewBrown })

    const addPage = Page.verifyOnPage(addPrisonerSearch)
    addPage.getInputField().type('Andrew')
    addPage.getSearchButton().click()
    addPage.getSelectPrisonerLink().click()

    cy.task('stubCreateNonAssociation')
    const addDetailsPage = Page.verifyOnPage(addPrisonerDetails)
    addDetailsPage.RadioButtonPrisonerRole.click()
    addDetailsPage.RadioButtonOtherPrisonerRole.click()
    addDetailsPage.RadioButtonReason.click()
    addDetailsPage.RadioButtonRestrictionType.click()
    addDetailsPage.getAddCommentBox().type('Andrew is a bully')
    addDetailsPage.getSaveButton().click()

    Page.verifyOnPage(addPrisonerConfirmation)
  })
})
