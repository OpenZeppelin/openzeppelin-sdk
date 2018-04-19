import PackageFilesInterface from '../utils/PackageFilesInterface'
import AppManager from './models/AppManager'


async function upgradeProxy(proxyAddress, contractName, { network, from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  const zosNetworkFile = files.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const index = proxies[contractName].findIndex(proxy => proxy.address === proxyAddress)

  if (index === undefined) {
    console.error(`Could not find a ${contractName} proxy with address ${proxyAddress}`)
    return
  }

  await AppManager.upgradeProxy(proxyAddress, contractName)
  proxies[contractName][index].version = AppManager.version

  zosNetworkFile.proxies = proxies
  files.writeNetworkFile(network, zosNetworkFile)
}

export default upgradeProxy
