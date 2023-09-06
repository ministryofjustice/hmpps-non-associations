import Page from '../pages/page'
import IndexPage from '../pages/index'

context('Index page', () => {
  beforeEach(() => {
    cy.resetBasicStubs()
  })

  it('User name visible in fallback header', () => {
    cy.signIn()
    cy.task('stubComponentsFail')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.fallbackHeaderUserName().should('contain.text', 'J. Smith')
  })
  it('Fallback footer exists with no content', () => {
    cy.signIn()
    cy.task('stubComponentsFail')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.fallbackFooter().should('not.include.text', 'Feedback')
  })
})
