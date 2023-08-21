import { davidJones, andrewBrown } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import PrisonerNonAssociations from '../pages/prisonerNonAssociations'
import addPrisonerNonAssociations from '../pages/addPrisonerNonAssociations'
import addPrisonerNonAssociationDetails from '../pages/addPrisonerNonAssociationDetails'
import addPrisonerNonAssociationConfirmation from '../pages/addPrisonerNonAssociationConfirmation'

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
    cy.task('stubOffenderSearchGetPrisonerResult', { prisonerNumber: 'A5678CS', result: andrewBrown })

    const addPage = Page.verifyOnPage(addPrisonerNonAssociations)
    addPage.getInputField('search').type('Andrew')
    addPage.getSearchButton().click()
    addPage.getSelectPrisonerLink().click()

    cy.task('stubCreateNonAssociation')
    const addDetailsPage = Page.verifyOnPage(addPrisonerNonAssociationDetails)
    addDetailsPage.RadioButtonPrisonerRole.click()
    addDetailsPage.RadioButtonOtherPrisonerRole.click()
    addDetailsPage.RadioButtonReason.click()
    addDetailsPage.RadioButtonRestrictionType.click()
    addDetailsPage.getAddCommentBox().type('Andrew is a bully')
    addDetailsPage.getSaveButton().click()

    Page.verifyOnPage(addPrisonerNonAssociationConfirmation)
  })
})
