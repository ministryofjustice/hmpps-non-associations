import Page from '../pages/page'
import IndexPage from '../pages/index'

context('Index page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserCaseloads')
  })

  // TODO: This need updating to work with the new footer & header
  it('should show expected header and footer elements', () => {
    cy.signIn()

    const homePage = Page.verifyOnPage(IndexPage)

    // homePage.headerUserName.should('contain.text', 'J. Smith')
    //
    // homePage.activeCaseload.should('contain.text', 'Moorland (HMP & YOI)')

    // homePage.footerLinks.spread((...links) => {
    //   expect(links).to.have.lengthOf(2)
    //   expect(links[0]).to.contain('Get help')
    //   expect(links[1]).to.contain('Terms')
    // })
  })
})
