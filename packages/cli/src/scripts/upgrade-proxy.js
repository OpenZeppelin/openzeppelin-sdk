import PackageFilesInterface from '../utils/PackageFilesInterface'

const AppManager = {
  upgradeProxy: () => '2.0.1'
}

const interface = new PackageFilesInterface();

function upgradeProxy(network, proxyAddress, contractName, ...args) {
  const zosNetworkFile = interface.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const index = proxies[contractName].findIndex(proxy => proxy.address === proxyAddress)

  if (index === undefined) {
    console.error(`Could not find a ${contractName} proxy with address ${proxyAddress}`)
    return
  }

  const newVersion = AppManager.upgradeProxy(proxyAddress, contractName)
  proxies[contractName][index].version = newVersion

  zosNetworkFile.proxies = proxies
  interface.writeNetworkFile(network, zosNetworkFile)
}


function run() {
  const args = process.argv.slice(2)
  upgradeProxy(...args)
}

run()