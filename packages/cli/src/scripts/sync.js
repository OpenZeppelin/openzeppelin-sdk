import PackageFilesInterface from '../utils/PackageFilesInterface'
import { AppManager } from './models/AppManager'

const interface = new PackageFilesInterface();

async function sync(network) {
  const zosPackage = interface.read()
  const zosNetworkFile = interface.readNetworkFile(network)

  if (zosPackage.version !== zosNetworkFile.app.version) {
    await AppManager.newVersion(zosPackage.version)
    zosNetworkFile.app.version = zosPackage.version
  }

  delete zosPackage['version']
  zosNetworkFile.package = zosPackage

  for (let contractName in zosPackage.contracts) {
    // TODO: store the implementation's hash to avoid unnecessary deployments
    const contractClass = artifacts.require(contractName)
    const contractInstance = await AppManager.setImplementation(contractClass, contractName)
    zosNetworkFile.package.contracts[contractName] = contractInstance.address
  }

  interface.writeNetworkFile(network, zosNetworkFile)
}


function run() {
  const args = process.argv.slice(2)
  sync(...args)
}

run()
