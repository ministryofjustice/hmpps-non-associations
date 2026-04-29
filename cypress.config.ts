import { defineConfig } from 'cypress'
import jwt from 'jsonwebtoken'

import { resetStubs } from './integration_tests/mockApis/wiremock'

import auth from './integration_tests/mockApis/auth'
import manageUsersApi from './integration_tests/mockApis/manageUsersApi'
import tokenVerification from './integration_tests/mockApis/tokenVerification'
import nomisUserRolesApi from './integration_tests/mockApis/nomisUserRolesApi'
import prisonApi from './integration_tests/mockApis/prisonApi'
import offenderSearchApi from './integration_tests/mockApis/offenderSearchApi'
import nonAssociationsApi from './integration_tests/mockApis/nonAssociationsApi'
import frontendComponents from './integration_tests/mockApis/frontendComponents'

function createToken({ roles }: { roles: string[] }) {
  // authorities in the session are always prefixed by ROLE.
  const authorities = roles.map(role => (role.startsWith('ROLE_') ? role : `ROLE_${role}`))
  const payload = {
    user_name: 'USER1',
    scope: ['read', 'write'],
    auth_source: 'NOMIS',
    authorities,
    jti: '83b50a10-cca6-41db-985f-e87efb303ddb',
    client_id: 'clientid',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'integration_tests/screenshots',
  videosFolder: 'integration_tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  video: false,
  taskTimeout: 60000,
  viewportWidth: 1200,
  viewportHeight: 850,
  e2e: {
    setupNodeEvents(on) {
      on('task', {
        resetStubs,
        createToken,
        ...auth,
        ...manageUsersApi,
        ...tokenVerification,
        ...nomisUserRolesApi,
        ...prisonApi,
        ...offenderSearchApi,
        ...nonAssociationsApi,
        ...frontendComponents,
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
  },
})
