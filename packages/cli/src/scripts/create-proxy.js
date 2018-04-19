import PackageFilesInterface from '../utils/PackageFilesInterface'

const AppManager = {
  create: () => '0x2'
}

const interface = new PackageFilesInterface();

function createProxy(network, contractName, version, ...args) {
  // TODO: if network file does not exists, create it
  const zosNetworkFile = interface.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const address = AppManager.create(version, contractName)

  if (proxies[contractName] == undefined) {
    proxies[contractName] = []
  }

  proxies[contractName].push({ address, version })

  zosNetworkFile.proxies = proxies
  interface.writeNetworkFile(network, zosNetworkFile)
}


function run() {
  const args = process.argv.slice(2)
  createProxy(...args)
}

run()