import Distribution from '../models/Distribution'
import makeContract from '../utils/contract'
import PackageFilesInterface from '../utils/PackageFilesInterface'

async function deploy({ network, from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  const distribution = new Distribution(from, network)
  if (! files.exists()) throw `Could not find package file ${packageFileName}`

  const zosPackage = files.read()
  let zosNetworkFile

  if (! files.existsNetworkFile(network)) {
    await distribution.deploy(zosPackage.version)
    createNetworkFile(network, distribution.address(), packageFileName)
    zosNetworkFile = files.readNetworkFile(network)
  } else {
    zosNetworkFile = files.readNetworkFile(network)
    await distribution.connect(zosNetworkFile.provider)
  }

  if (zosPackage.version !== zosNetworkFile.version) {
    await distribution.newVersion(zosPackage.version)
    zosNetworkFile.version = zosPackage.version
  }

  delete zosPackage['version']
  zosNetworkFile.package = zosPackage

  const currentProvider = await distribution.getRelease(zosPackage.version)
  zosNetworkFile.provider = { address: currentProvider.address }

  for (let contractName in zosPackage.contracts) {
    // TODO: store the implementation's hash to avoid unnecessary deployments
    const contractClass = makeContract.local(zosPackage.contracts[contractName])
    const contractInstance = await distribution.setImplementation(zosPackage.version, contractClass, contractName)
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
    'version': { version },
    ...zosPackage
  }

  files.writeNetworkFile(network, zosNetworkFile)
  return true
}

module.exports = sync
