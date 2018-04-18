import PackageFilesInterface from '../utils/PackageFilesInterface'

const AppManager = {
  createProxy: () => 0x1
}


function createProxy(network, contractName, version, ...args) {
  // TODO: if network file does not exists, create it
  const zosNetworkPackage = PackageFilesInterface.readNetworkFile(network)
  const proxy = AppManager.createProxy(version, contractName)

  zosNetworkPackage.proxies[contractName] = { proxy, version }
  PackageFilesInterface.writeNetworkFile(network, zosNetworkPackage)
}


function run() {
  const args = process.argv.slice(2)
  createProxy(...args)
}

run()