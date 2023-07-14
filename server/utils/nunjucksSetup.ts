/* eslint-disable no-param-reassign */
import path from 'path'

import nunjucks from 'nunjucks'
import express from 'express'

import config from '../config'
import type { Services } from '../services'
import format from './format'
import { initialiseName } from './utils'

export default function nunjucksSetup(app: express.Express, services: Services): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Non-associations'
  app.locals.production = config.production
  app.locals.environment = config.environment

  app.locals.dpsUrl = config.dpsUrl
  app.locals.supportUrl = config.supportUrl
  app.locals.routeUrls = services.routeUrls

  app.locals.googleAnalyticsMeasurementId = config.googleAnalyticsMeasurementId

  // Cachebusting version string
  if (config.production) {
    // Version only changes with new commits
    app.locals.version = services.applicationInfo.gitShortHash
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  // name formatting
  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('possessiveName', format.possessiveName)

  // date & number formatting
  njkEnv.addFilter('dateAndTime', format.dateAndTime)
  njkEnv.addFilter('date', format.date)
  njkEnv.addFilter('thousands', format.thousands)
}
