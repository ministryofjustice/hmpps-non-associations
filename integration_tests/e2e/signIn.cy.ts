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
    cy.task('reset')
    cy.task('stubSignIn', { roles: [] })
    cy.task('stubManageUser')
    cy.task('stubNomisUserCaseloads')
    cy.task('stubDpsComponentsFail')
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

      // can't do a visit here as cypress requires only one domain
      cy.request(`/prisoner/${davidJones.prisonerNumber}/non-associations`).its('body').should('contain', 'Sign in')
    })

    it('Token verification failure clears user session', () => {
      cy.task('stubVerifyToken', false)

      // can't do a visit here as cypress requires only one domain
      cy.request(`/prisoner/${davidJones.prisonerNumber}/non-associations`).its('body').should('contain', 'Sign in')

      cy.task('stubVerifyToken', true)
      cy.task('stubManageUser', 'bobby brown')
      cy.signIn()

      listPage.headerUserName.contains('B. Brown')
    })
  })
})
