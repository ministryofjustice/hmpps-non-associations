import config from './config'

export type ApplicationInfo = {
  applicationName: string
  buildNumber: string
  gitRef: string
  gitShortHash: string
}

export default (): ApplicationInfo => {
  const { buildNumber, gitRef } = config
  return { applicationName: 'hmpps-non-associations', buildNumber, gitRef, gitShortHash: gitRef.substring(0, 7) }
}
