context('Healthcheck', () => {
  context('All healthy', () => {
    beforeEach(() => {
      cy.task('resetStubs')
      cy.task('stubAuthPing')
      cy.task('stubFrontendComponentsApiPing')
      cy.task('stubTokenVerificationPing')
      cy.task('stubManageUsersPing')
      cy.task('stubNomisUserRolesApiPing')
      cy.task('stubPrisonApiPing')
      cy.task('stubOffenderSearchPing')
      cy.task('stubNonAssociationsApiPing')
    })

    it('Health check page is visible', () => {
      cy.request('/health').its('body.status').should('equal', 'UP')
    })

    it('Ping is visible and UP', () => {
      cy.request('/ping').its('body.status').should('equal', 'UP')
    })
  })

  context('Some unhealthy', () => {
    it('Reports correctly when token verification down', () => {
      cy.task('resetStubs')
      cy.task('stubAuthPing')
      cy.task('stubTokenVerificationPing', 500)

      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.body.components.hmppsAuth.status).to.equal('UP')
        expect(response.body.components.tokenVerification.status).to.equal('DOWN')
        expect(response.body.components.tokenVerification.details).to.contain({ status: 500, attempts: 3 })
      })
    })
  })
})
