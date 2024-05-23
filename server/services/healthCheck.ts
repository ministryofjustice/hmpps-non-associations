import { serviceCheckFactory } from '../data/healthCheck'
import config from '../config'
import type { AgentConfig } from '../config'
import type { ApplicationInfo } from '../applicationInfo'

interface HealthCheckStatus {
  name: string
  status: string
  message: unknown
}

interface HealthCheckResult extends Record<string, unknown> {
  status: string
  components: Record<string, unknown>
}

export type HealthCheckService = () => Promise<HealthCheckStatus>
export type HealthCheckCallback = (result: HealthCheckResult) => void

function service(name: string, url: string, agentConfig: AgentConfig): HealthCheckService {
  const check = serviceCheckFactory(name, url, agentConfig)
  return () =>
    check()
      .then(result => ({ name, status: 'UP', message: result }))
      .catch(err => ({ name, status: 'DOWN', message: err }))
}

function addAppInfo(result: HealthCheckResult, applicationInfo: ApplicationInfo): HealthCheckResult {
  const buildInfo = {
    uptime: process.uptime(),
    build: {
      buildNumber: applicationInfo.buildNumber,
      gitRef: applicationInfo.gitRef,
    },
    version: applicationInfo.buildNumber,
    productId: applicationInfo.productId,
  }

  return { ...result, ...buildInfo }
}

function gatherCheckInfo(aggregateStatus: Record<string, unknown>, currentStatus: HealthCheckStatus) {
  return { ...aggregateStatus, [currentStatus.name]: { status: currentStatus.status, details: currentStatus.message } }
}

const apiChecks = [
  service('hmppsAuth', `${config.apis.hmppsAuth.url}/health/ping`, config.apis.hmppsAuth.agent),
  service(
    'hmppsNomisUserRolesApi',
    `${config.apis.nomisUserRolesApi.url}/health/ping`,
    config.apis.nomisUserRolesApi.agent,
  ),
  service('hmppsPrisonApi', `${config.apis.hmppsPrisonApi.url}/health/ping`, config.apis.hmppsPrisonApi.agent),
  service('offenderSearchApi', `${config.apis.offenderSearchApi.url}/health/ping`, config.apis.offenderSearchApi.agent),
  service('manageUsersApi', `${config.apis.manageUsersApi.url}/health/ping`, config.apis.manageUsersApi.agent),
  service(
    'hmppsNonAssociationsApi',
    `${config.apis.hmppsNonAssociationsApi.url}/health/ping`,
    config.apis.hmppsNonAssociationsApi.agent,
  ),
  ...(config.apis.tokenVerification.enabled
    ? [
        service(
          'tokenVerification',
          `${config.apis.tokenVerification.url}/health/ping`,
          config.apis.tokenVerification.agent,
        ),
      ]
    : []),
]

export default function healthCheck(
  applicationInfo: ApplicationInfo,
  callback: HealthCheckCallback,
  checks = apiChecks,
): void {
  Promise.all(checks.map(fn => fn())).then(checkResults => {
    const allOk = checkResults.every(item => item.status === 'UP') ? 'UP' : 'DOWN'

    const result = {
      status: allOk,
      components: checkResults.reduce(gatherCheckInfo, {}),
    }

    callback(addAppInfo(result, applicationInfo))
  })
}
