import fs from 'fs'
import path from 'path'

import config from './config'

export type ApplicationInfo = {
  applicationName: string
  productId: string
  buildNumber: string
  gitRef: string
  gitShortHash: string
  packageJsonPath: string
}

export default (): ApplicationInfo => {
  const { buildNumber, gitRef } = config
  return {
    applicationName: 'hmpps-non-associations',
    productId: config.productId,
    buildNumber,
    gitRef,
    gitShortHash: gitRef.substring(0, 7),
    get packageJsonPath(): string {
      return findPackageJson()
    },
  }
}

/**
 * The app runs from built JS files under ./dist
 * The tests run directly from TS files under ./
 * This function finds the application root where the package.json file resides
 */
function findPackageJson(): string {
  for (const p of [path.dirname(__dirname), path.dirname(path.dirname(__dirname))]) {
    try {
      fs.accessSync(path.join(p, 'package.json'), fs.constants.R_OK)
      return p
    } catch {
      /* empty */
    }
  }
  throw new Error('Could not find path of package.json')
}
