import PackageFilesInterface from '../utils/PackageFilesInterface'

const AppManager = {
  getImplementation: contractName => `${contractName}_contract_address`
}

const interface = new PackageFilesInterface();

function initProxies(network) {
  const zosPackage = interface.read()

  const zosNetworkFile = {
    'app': {
      'address': '0x1',
      'version': zosPackage.version
    },
    'proxies': {},
    'package': zosPackage
  }

  delete zosNetworkFile.package['version']

  for (let contractName in zosPackage.contracts) {
    zosNetworkFile.package.contracts[contractName] = AppManager.getImplementation(contractName)
  }

  interface.writeNetworkFile(network, zosNetworkFile)
}


function run() {
  const args = process.argv.slice(2)
  initProxies(...args)
}

run()