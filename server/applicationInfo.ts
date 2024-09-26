import path from 'node:path'

import config from './config'

export type ApplicationInfo = {
  applicationName: string
  productId: string
  buildNumber: string
  gitRef: string
  gitShortHash: string
  branchName: string
  assetsPath: string
}

export default (): ApplicationInfo => {
  const assetsPath = path.join(__dirname, '../assets')
  const { buildNumber, gitRef } = config
  return {
    applicationName: 'hmpps-non-associations',
    productId: config.productId,
    buildNumber,
    gitRef,
    gitShortHash: gitRef.substring(0, 7),
    branchName: config.branchName,
    assetsPath,
  }
}
