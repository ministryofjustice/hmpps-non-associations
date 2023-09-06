/* eslint-disable no-param-reassign */
import express from 'express'
import config from '../config'

export default (app: express.Express) => {
  app.locals.environmentName = config.environment
  app.locals.environmentNameColour = config.environment === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''
}
