import PackageFilesInterface from '../utils/PackageFilesInterface'
import AppManager from '../models/AppManager'

async function sync({ network, from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  const zosNetworkFile = files.readNetworkFile(network)
  const appManager = new AppManager(from)

  if (zosPackage.version !== zosNetworkFile.app.version) {
    await appManager.newVersion(zosPackage.version)
    zosNetworkFile.app.version = zosPackage.version
  }

  delete zosPackage['version']
  zosNetworkFile.package = zosPackage

  for (let contractName in zosPackage.contracts) {
    // TODO: store the implementation's hash to avoid unnecessary deployments
    const contractClass = artifacts.require(contractName)
    const contractInstance = await appManager.setImplementation(contractClass, contractName)
    zosNetworkFile.package.contracts[contractName] = contractInstance.address
  }

  files.writeNetworkFile(network, zosNetworkFile)
}

module.exports = sync
