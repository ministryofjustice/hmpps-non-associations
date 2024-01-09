/* eslint-disable no-param-reassign */
import path from 'path'

import nunjucks from 'nunjucks'
import express from 'express'

import config from '../config'
import type { Services } from '../services'
import { checkedItems, multipleCheckedItems } from './checkedItems'
import format from './format'
import { convertToTitleCase, initialiseName, nameOfPerson, reversedNameOfPerson, prisonerLocation } from './utils'
import { isBeingTransferred, isOutside, isInPrison } from '../data/offenderSearch'

export default function nunjucksSetup(app: express.Express, services: Services): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Non-associations'
  app.locals.production = config.production
  app.locals.environment = config.environment

  app.locals.authUrl = config.apis.hmppsAuth.externalUrl
  app.locals.dpsUrl = config.dpsUrl
  app.locals.feedbackSurveyUrl = config.feedbackSurveyUrl
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
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  // name formatting
  njkEnv.addFilter('convertToTitleCase', convertToTitleCase)
  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('nameOfPerson', nameOfPerson)
  njkEnv.addFilter('reversedNameOfPerson', reversedNameOfPerson)
  njkEnv.addFilter('possessiveName', format.possessiveName)

  // prisoner utils
  njkEnv.addFilter('prisonerLocation', prisonerLocation)
  njkEnv.addFilter('isBeingTransferred', isBeingTransferred)
  njkEnv.addFilter('isOutside', isOutside)
  njkEnv.addFilter('isInPrison', isInPrison)

  // date & number formatting
  njkEnv.addFilter('dateAndTime', format.dateAndTime)
  njkEnv.addFilter('date', format.date)
  njkEnv.addFilter('shortDate', format.shortDate)
  njkEnv.addFilter('thousands', format.thousands)

  // utils for GDS & MoJ components
  njkEnv.addFilter('checkedItems', checkedItems)
  njkEnv.addFilter('multipleCheckedItems', multipleCheckedItems)
}
