import AppManager from '../models/AppManager'
import PackageFilesInterface from '../utils/PackageFilesInterface'
import Logger from '../utils/Logger'

const log = new Logger('sync')


async function sync({ network, from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  const appManager = new AppManager(from)

  if (! files.exists()) {
    log.error(`Could not find package file ${packageFileName}`)
    return
  }

  const zosPackage = files.read()
  let zosNetworkFile

  if (! files.existsNetworkFile(network)) {
    await appManager.deploy(zosPackage.version)
    createNetworkFile(network, appManager.address(), packageFileName)
    zosNetworkFile = files.readNetworkFile(network)
  } else {
    zosNetworkFile = files.readNetworkFile(network)
    await appManager.connect(zosNetworkFile.app.address)
  }

  if (zosPackage.version !== zosNetworkFile.app.version) {
    await appManager.newVersion(zosPackage.version)
    zosNetworkFile.app.version = zosPackage.version
  }

  delete zosPackage['version']
  zosNetworkFile.package = zosPackage

  const currentProvider = await appManager.getCurrentDirectory()

  zosNetworkFile.provider = {
    'address': currentProvider.address
  }

  for (let contractName in zosPackage.contracts) {
    // TODO: store the implementation's hash to avoid unnecessary deployments
    const contractClass = artifacts.require(zosPackage.contracts[contractName])
    const contractInstance = await appManager.setImplementation(contractClass, contractName)
    zosNetworkFile.package.contracts[contractName] = contractInstance.address
  }

  files.writeNetworkFile(network, zosNetworkFile)
}


function createNetworkFile(network, address, packageFileName) {
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()

  const { version } = zosPackage
  delete zosPackage['version']

  const zosNetworkFile = {
    'app': { address, version },
    'proxies': {},
    'package': zosPackage
  }

  files.writeNetworkFile(network, zosNetworkFile)
  return true
}


module.exports = sync
