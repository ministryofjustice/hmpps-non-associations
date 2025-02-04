import path from 'node:path'

import compression from 'compression'
import express, { Router } from 'express'
import noCache from 'nocache'

import config from '../config'

export default function setUpStaticResources(): Router {
  const router = express.Router()

  router.use(compression())

  /** Add a static asset route */
  function staticRoute(assetUrl: string, assetPath: string): void {
    router.use(
      assetUrl,
      express.static(path.join(process.cwd(), assetPath), {
        maxAge: config.staticResourceCacheDuration,
        redirect: false,
      }),
    )
  }

  // Application assets
  Array.of(
    '/dist/assets',
    '/node_modules/govuk-frontend/dist/govuk/assets',
    '/node_modules/govuk-frontend/dist',
    '/node_modules/@ministryofjustice/frontend/moj/assets',
    '/node_modules/@ministryofjustice/frontend',
    '/node_modules/jquery/dist',
  ).forEach(dir => staticRoute('/assets', dir))
  staticRoute('/assets/js/jquery.min.js', '/node_modules/jquery/dist/jquery.min.js')

  // Digital Prison Reporting & related third-party plugins
  staticRoute('/moj/assets', '/node_modules/@ministryofjustice/frontend/moj/assets') // DPR forces MoJ assets to load from /moj/assets
  staticRoute('/assets/dpr', '/node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/assets')
  staticRoute('/assets/ext/chart.js', '/node_modules/chart.js/dist/chart.umd.js')
  staticRoute(
    '/assets/ext/chartjs-datalabels.js',
    '/node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js',
  )
  staticRoute('/assets/ext/day.js', '/node_modules/dayjs/dayjs.min.js')
  staticRoute('/assets/ext/dayjs/plugin/customParseFormat.js', '/node_modules/dayjs/plugin/customParseFormat.js')

  // Don't cache dynamic resources
  router.use(noCache())

  return router
}
