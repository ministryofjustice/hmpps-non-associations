import { davidJones, fredMills, oscarJones } from '../../server/data/testData/offenderSearch'
import Page from '../pages/page'
import ListPage from '../pages/nonAssociations/list'

context('List non-associations page', () => {
  let listPage: ListPage

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserCaseloads')
    cy.task('stubPrisonApiGetPhoto')
    cy.task('stubPrisonApiGetStaffDetails')
    cy.task('stubOffenderSearchGetPrisoner')
    cy.task('stubListNonAssociations')
    cy.signIn()

    cy.visit(`/prisoner/${davidJones.prisonerNumber}/non-associations`)
    listPage = Page.verifyOnPage(ListPage, 'David Jones’')
  })

  it('has correct title', () => {
    cy.title().should('eq', 'David Jones’ non-associations')
  })

  it('has correct breadcrumb', () => {
    listPage.checkLastBreadcrumb('Jones, David')
  })

  it('has add button', () => {
    listPage.addButton.should('exist')
  })

  it('should show key prisoner’s details', () => {
    listPage.keyPrisonerBox.should('contain.text', 'Jones, David')
    listPage.keyPrisonerBox.should('contain.text', davidJones.prisonerNumber)
    listPage.keyPrisonerBox.should('contain.text', davidJones.cellLocation)
  })

  it('should have open tab selected', () => {
    listPage.openTab.should('have.class', 'govuk-tabs__list-item--selected')
  })

  it('should show a table of open non-associations', () => {
    listPage.tableRowContents.then(rows => {
      expect(rows).to.have.length(2)
      const [fredMillsRow, oscarJonesRow] = rows

      expect(fredMillsRow[1]).to.contain(fredMills.prisonerNumber)
      expect(fredMillsRow[1]).to.contain('Mills, Fred')
      expect(fredMillsRow[2]).to.contain('Violence')
      expect(fredMillsRow[3]).to.contain('Victim')
      expect(fredMillsRow[4]).to.contain('Cell and landing')
      expect(fredMillsRow[5]).to.contain('IR 12133111')
      expect(fredMillsRow[6]).to.contain('26 July 2023')
      expect(fredMillsRow[6]).to.contain('Mary Johnson')

      expect(oscarJonesRow[1]).to.contain(oscarJones.prisonerNumber)
      expect(oscarJonesRow[1]).to.contain('Jones, Oscar')
      expect(oscarJonesRow[2]).to.contain('Police')
      expect(oscarJonesRow[3]).to.contain('Not relevant')
      expect(oscarJonesRow[4]).to.contain('Cell only')
      expect(oscarJonesRow[5]).to.contain('Pending court case')
      expect(oscarJonesRow[6]).to.contain('21 July 2023')
      expect(oscarJonesRow[6]).to.contain('Mark Simmons')
    })
  })

  it('should display the closed tab', () => {
    listPage.closedTab.should('not.have.class', 'govuk-tabs__list-item--selected')
    listPage.closedTab.find('a').click()
    listPage.closedTab.should('have.class', 'govuk-tabs__list-item--selected')
  })
})
