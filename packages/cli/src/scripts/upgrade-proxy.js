import PackageFilesInterface from '../utils/PackageFilesInterface'
import { AppManager } from './models/AppManager'

const interface = new PackageFilesInterface();

async function upgradeProxy(network, proxyAddress, contractName, ...args) {
  const zosNetworkFile = interface.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const index = proxies[contractName].findIndex(proxy => proxy.address === proxyAddress)

  if (index === undefined) {
    console.error(`Could not find a ${contractName} proxy with address ${proxyAddress}`)
    return
  }

  await AppManager.upgradeProxy(proxyAddress, contractName)
  proxies[contractName][index].version = AppManager.version

  zosNetworkFile.proxies = proxies
  interface.writeNetworkFile(network, zosNetworkFile)
}


function run() {
  const args = process.argv.slice(2)
  upgradeProxy(...args)
}

run()