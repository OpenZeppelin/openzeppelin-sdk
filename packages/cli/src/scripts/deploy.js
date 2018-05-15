import PackageFilesInterface from '../utils/PackageFilesInterface'
import { Logger, Contracts, Package } from 'zos-lib'

const log = new Logger('deploy')

// TODO: remove version param
export default async function deploy({ version, network, txParams = {}, packageFileName = undefined}) {
  if (version === undefined || version === '') throw Error('A version name must be provided to initialize a new version.')

  const files = new PackageFilesInterface(packageFileName)
  if (! files.exists()) throw Error(`Could not find package file ${packageFileName}`)

  const zosPackage = files.read()
  let zosNetworkFile

  // 1. Get or create package
  let _package
  if (files.existsNetworkFile(network)) {
    log.info('Reading network file...')
    zosNetworkFile = files.readNetworkFile(network)
    _package = await Release.from(zosNetworkFile.distribution.address, txParams)
  } else {
    log.info('Network file not found, deploying new package...')
    _package = await Package.deploy(txParams)
    createNetworkFile(network, _package.address(), packageFileName)
    zosNetworkFile = files.readNetworkFile(network)
  }

  // 2. Create new release
  log.info(`Creating release version ${version}...`)
  const release = await _package.newVersion(version)

  // 3. For each implementation, deploy it and register it into the release
  for (let contractAlias in zosPackage.contracts) {
    // TODO: store the implementation's hash to avoid unnecessary deployments
    log.info(`Deploying ${contractAlias} contract...`)
    const contractName = zosPackage.contracts[contractAlias];
    const contractClass = Contracts.getFromLocal(contractName)
    const contractInstance = await _package.setImplementation(version, contractClass, contractAlias)
    zosNetworkFile.contracts[contractAlias] = contractInstance.address
  }

  // 4. Freeze release
  log.info('Freezing release...')
  await _package.freeze(version)

  zosNetworkFile.provider = { address: release.address }

  files.writeNetworkFile(network, zosNetworkFile)
}


function createNetworkFile(network, address, packageFileName) {
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()

  delete zosPackage['version']
  delete zosPackage['name']

  const zosNetworkFile = {
    distribution: { address },
    ...zosPackage
  }

  files.writeNetworkFile(network, zosNetworkFile)
}
