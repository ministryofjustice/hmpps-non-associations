import healthCheck from './healthCheck'
import type { ApplicationInfo } from '../applicationInfo'
import type { HealthCheckCallback, HealthCheckService } from './healthCheck'

describe('Healthcheck', () => {
  const testAppInfo: ApplicationInfo = {
    applicationName: 'test',
    buildNumber: '1',
    gitRef: 'long ref',
    gitShortHash: 'short ref',
    packageJsonPath: '../..',
  }

  it('Healthcheck reports healthy', done => {
    const successfulChecks = [successfulCheck('check1'), successfulCheck('check2')]

    const callback: HealthCheckCallback = result => {
      expect(result).toEqual(
        expect.objectContaining({
          healthy: true,
          checks: { check1: 'some message', check2: 'some message' },
        }),
      )
      done()
    }

    healthCheck(testAppInfo, callback, successfulChecks)
  })

  it('Healthcheck reports unhealthy', done => {
    const successfulChecks = [successfulCheck('check1'), erroredCheck('check2')]

    const callback: HealthCheckCallback = result => {
      expect(result).toEqual(
        expect.objectContaining({
          healthy: false,
          checks: { check1: 'some message', check2: 'some error' },
        }),
      )
      done()
    }

    healthCheck(testAppInfo, callback, successfulChecks)
  })
})

function successfulCheck(name: string): HealthCheckService {
  return () =>
    Promise.resolve({
      name: `${name}`,
      status: 'ok',
      message: 'some message',
    })
}

function erroredCheck(name: string): HealthCheckService {
  return () =>
    Promise.resolve({
      name: `${name}`,
      status: 'ERROR',
      message: 'some error',
    })
}
