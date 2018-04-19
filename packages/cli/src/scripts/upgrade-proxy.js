import AppManager from '../models/AppManager'
import PackageFilesInterface from '../utils/PackageFilesInterface'
import Logger from '../utils/Logger'

const log = new Logger('upgrade-proxy')


async function upgradeProxy(proxyAddress, contractName, { network, from, packageFileName }) {
  if (proxyAddress === undefined) {
    log.error(`Must provide a proxy address`)
    return
  } else if (contractName === undefined) {
    log.error(`Must provide a contract name`)
    return
  }

  const appManager = new AppManager(from)
  const files = new PackageFilesInterface(packageFileName)

  const zosNetworkFile = files.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const index = proxies[contractName].findIndex(proxy => proxy.address === proxyAddress)

  if (index === undefined) {
    log.error(`Could not find a ${contractName} proxy with address ${proxyAddress}`)
    return
  }

  await appManager.connect(zosNetworkFile.app.address)
  await appManager.upgradeProxy(proxyAddress, contractName)
  proxies[contractName][index].version = appManager.version

  zosNetworkFile.proxies = proxies
  files.writeNetworkFile(network, zosNetworkFile)
}

module.exports = upgradeProxy
