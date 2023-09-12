import Page from '../pages/page'
import IndexPage from '../pages/index'
import AuthSignInPage from '../pages/authSignIn'

context('SignIn', () => {
  beforeEach(() => {
    cy.resetBasicStubs()
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Unauthenticated user navigating to sign in page directed to auth', () => {
    cy.visit('/sign-in')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Non-prison users are not permitted', () => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: [] })
    cy.task('stubAuthUser', { roles: [] })
    cy.task('stubNomisUserCaseloads')
    cy.task('stubDpsComponentsFail')
    cy.signIn({ failOnStatusCode: false })
    cy.get('body').should('contain.text', 'Authorisation Error')
  })

  it('User name visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerUserName.should('contain.text', 'J. Smith')
  })

  it('User can log out', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.signOut.click()
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Token verification failure takes user to sign in page', () => {
    cy.signIn()
    Page.verifyOnPage(IndexPage)
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')
  })

  it('Token verification failure clears user session', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')

    cy.task('stubVerifyToken', true)
    cy.task('stubAuthUser', { name: 'bobby brown' })
    cy.signIn()

    indexPage.headerUserName.contains('B. Brown')
  })
})
