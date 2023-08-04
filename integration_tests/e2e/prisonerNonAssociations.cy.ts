import type { UserRole } from '../../server/data/hmppsAuthClient'

// TODO: Add imports
// import Page from '../pages/page'
// import HomePage from '../pages/home'

context('Prisoner non associations', () => {
  beforeEach(() => {
    const roles: UserRole[] = [{ roleCode: 'NON_ASSOCIATIONS' }]
    cy.task('reset')
    cy.task('stubSignIn', { roles })
    cy.task('stubAuthUser', { roles })
    cy.task('stubPrisonApiLocations')
    cy.task('stubIncentiveLevels', { inactive: true })
    cy.task('stubIncentiveLevel')

    cy.signIn()
  })

  // TODO: Add tests
})
