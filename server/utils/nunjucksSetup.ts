/* eslint-disable no-param-reassign */
import fs from 'node:fs'
import path from 'node:path'

import express from 'express'
import nunjucks from 'nunjucks'
import setUpNunjucksFilters from '@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/setUpNunjucksFilters'

import logger from '../../logger'
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

  app.locals.teamEmail = config.teamEmail
  app.locals.authUrl = config.apis.hmppsAuth.externalUrl
  app.locals.dpsUrl = config.dpsUrl
  app.locals.feedbackSurveyUrl = config.feedbackSurveyUrl
  app.locals.supportUrl = config.supportUrl
  app.locals.routeUrls = services.routeUrls

  app.locals.googleAnalyticsMeasurementId = config.googleAnalyticsMeasurementId

  let assetManifest: Record<string, string> = {}
  try {
    const assetMetadataPath = path.resolve(__dirname, '../../assets/manifest.json')
    assetManifest = JSON.parse(fs.readFileSync(assetMetadataPath, 'utf8'))
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(`Could not read asset manifest file: ${e.message}`)
    }
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
      // Digital Prison Reporting configuration
      'node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend/',
      'node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/components/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  // Digital Prison Reporting configuration
  setUpNunjucksFilters(njkEnv)

  // static asset
  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)

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
