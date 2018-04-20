import AppManager from '../models/AppManager'
import PackageFilesInterface from '../utils/PackageFilesInterface'
import Logger from '../utils/Logger'
import makeContract from '../utils/contract'

const log = new Logger('creaty-proxy')

async function createProxy(contractAlias, { network, from, packageFileName }) {
  if (contractAlias === undefined) {
    log.error('Must provide a contract alias')
    return
  }

  const files = new PackageFilesInterface(packageFileName)
  // TODO: if network file does not exists, create it
  const zosPackage = files.read()
  const zosNetworkFile = files.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const appManager = new AppManager(from)
  await appManager.connect(zosNetworkFile.app.address)

  const contractName = zosPackage.contracts[contractAlias]

  if (! contractName) {
    log.error(`Could not find ${contractAlias} contract in zOS package file`)
    return
  }

  const contractClass = makeContract(contractName)
  const proxyInstance = await appManager.createProxy(contractClass, contractAlias)

  const { address } = proxyInstance
  const { version } = appManager

  proxies[contractAlias] = proxies[contractAlias] || []
  proxies[contractAlias].push({ address, version })

  zosNetworkFile.proxies = proxies
  files.writeNetworkFile(network, zosNetworkFile)
}

module.exports = createProxy
