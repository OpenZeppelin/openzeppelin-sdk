import PackageFilesInterface from '../utils/PackageFilesInterface'
import Logger from '../utils/Logger'

const log = new Logger('add-implementation')


async function addImplementation(contractName, alias, { packageFileName }) {
  if (contractName === undefined) {
    log.error('Must provide a contract name')
    return
  } else if (alias === undefined) {
    log.error('Must provide an alias')
    return
  }

  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  zosPackage.contracts[alias] = contractName
  files.write(zosPackage)
}

module.exports = addImplementation