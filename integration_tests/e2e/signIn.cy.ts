import Page from '../pages/page'
import AuthSignInPage from '../pages/authSignIn'
import ListPage from '../pages/nonAssociations/list'
import { davidJones } from '../../server/data/testData/offenderSearch'

context('Sign in', () => {
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
    cy.task('resetStubs')
    cy.task('stubSignIn', { roles: [] })
    cy.task('stubManageUser')
    cy.task('stubNomisUserCaseloads')
    cy.task('stubFallbackHeaderAndFooter')
    cy.signIn({ failOnStatusCode: false })
    cy.get('body').should('contain.text', 'Authorisation Error')
  })

  context('After successful login…', () => {
    let listPage: ListPage

    beforeEach(() => {
      cy.navigateToDavidJonesNonAssociations().then(result => {
        listPage = result
      })
    })

    it('User can log out', () => {
      listPage.signOut.click()
      Page.verifyOnPage(AuthSignInPage)
    })

    it('Token verification failure takes user to sign in page', () => {
      cy.task('stubVerifyToken', false)

      cy.visit(`/prisoner/${davidJones.prisonerNumber}/non-associations`)
      Page.verifyOnPage(AuthSignInPage)
    })

    it('Token verification failure clears user session', () => {
      cy.task('stubVerifyToken', false)

      cy.visit(`/prisoner/${davidJones.prisonerNumber}/non-associations`)
      Page.verifyOnPage(AuthSignInPage)

      cy.task('stubVerifyToken', true)
      cy.task('stubManageUser', 'bobby brown')
      cy.signIn()

      listPage.headerUserName.contains('B. Brown')
    })
  })
})
