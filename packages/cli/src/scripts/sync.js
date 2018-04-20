import AppManager from '../models/AppManager'
import makeContract from '../utils/contract'
import PackageFilesInterface from '../utils/PackageFilesInterface'

async function sync({ network, from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  const appManager = new AppManager(from, network)
  if (! files.exists()) throw `Could not find package file ${packageFileName}`

  const zosPackage = files.read()
  let zosNetworkFile

  // Get AppManager instance
  if (files.existsNetworkFile(network)) {
    zosNetworkFile = files.readNetworkFile(network)
    await appManager.connect(zosNetworkFile.app.address)
  } else {
    await appManager.deploy(zosPackage.version)
    createNetworkFile(network, appManager.address(), packageFileName)
    zosNetworkFile = files.readNetworkFile(network)
  }

  if (zosPackage.version !== zosNetworkFile.app.version) {
    await appManager.newVersion(zosPackage.version)
    zosNetworkFile.app.version = zosPackage.version
  }

  const currentProvider = await appManager.getCurrentDirectory()
  zosNetworkFile.provider = { address: currentProvider.address }

  for (let contractName in zosPackage.contracts) {
    // TODO: store the implementation's hash to avoid unnecessary deployments
    const contractClass = makeContract.local(zosPackage.contracts[contractName])
    const contractInstance = await appManager.setImplementation(contractClass, contractName)
    zosNetworkFile.contracts[contractName] = contractInstance.address
  }

  if (zosPackage.stdlib) {
    const stdlibAddress = await appManager.setStdlib(zosPackage.stdlib)
    zosNetworkFile.stdlib = { address: stdlibAddress }
  } else {
    delete zosNetworkFile['stdlib']
    await appManager.setStdlib(null)
  }

  files.writeNetworkFile(network, zosNetworkFile)
}

function createNetworkFile(network, address, packageFileName) {
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()

  const { version } = zosPackage
  delete zosPackage['version']
  delete zosPackage['name']

  const zosNetworkFile = {
    'app': { address, version },
    'proxies': {},
    ...zosPackage
  }

  files.writeNetworkFile(network, zosNetworkFile)
}

module.exports = sync
