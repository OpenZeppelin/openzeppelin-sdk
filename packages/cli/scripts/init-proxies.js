import PackageFilesInterface from '../utils/PackageFilesInterface'

const AppManager = {
  getContractAddress: contractName => `${contractName}_contract_address`
}

function initProxies(network) {
  const zosPackage = PackageFilesInterface.read()

  const zosNetworkPackage = {
    'app': {
      'address': 0x0,
      'version': zosPackage.version
    },
    'proxies': {},
    'package': zosPackage
  }

  for (let contractName in zosPackage.contracts) {
    delete zosNetworkPackage.package['version']
    zosNetworkPackage.package.contracts[contractName] = AppManager.getContractAddress(contractName)
  }

  PackageFilesInterface.writeNetworkFile(network, zosNetworkPackage)
}


function run() {
  const args = process.argv.slice(2)
  initProxies(...args)
}

run()