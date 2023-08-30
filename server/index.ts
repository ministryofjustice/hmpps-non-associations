import promClient from 'prom-client'
import { createMetricsApp } from './monitoring/metricsApp'
import createApp from './app'
import { services } from './services'

promClient.collectDefaultMetrics()

export const app = createApp(services())
export const metricsApp = createMetricsApp()
