import Page from '../pages/page'
import IndexPage from '../pages/index'

context('Index page', () => {
  beforeEach(() => {
    cy.resetBasicStubs()
  })

  it('User name visible in fallback header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.fallbackHeaderUserName().should('contain.text', 'J. Smith')
  })

  it('Fallback footer exists basic links', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.fallbackFooter().should('contain.text', 'Official sensitive')
  })
})
