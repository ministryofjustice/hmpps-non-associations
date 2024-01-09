import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'

import auth from './integration_tests/mockApis/auth'
import manageUsersApi from './integration_tests/mockApis/manageUsersApi'
import tokenVerification from './integration_tests/mockApis/tokenVerification'
import nomisUserRolesApi from './integration_tests/mockApis/nomisUserRolesApi'
import prisonApi from './integration_tests/mockApis/prisonApi'
import offenderSearchApi from './integration_tests/mockApis/offenderSearchApi'
import nonAssociationsApi from './integration_tests/mockApis/nonAssociationsApi'
import frontendComponents from './integration_tests/mockApis/frontendComponents'

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
        reset: resetStubs,
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
