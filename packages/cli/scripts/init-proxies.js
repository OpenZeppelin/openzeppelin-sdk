import PackageFilesInterface from '../utils/PackageFilesInterface'


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
    zosNetworkPackage.package.contracts[contractName] = getContractAddress(contractName)
  }

  PackageFilesInterface.writeNetworkFile(network, zosNetworkPackage)
}


function getContractAddress(contractName) {
  return `${contractName}_contract_address`
}


function getProxyAddress(contractName) {
  return `${contractName}_proxy_address`
}


function run() {
  const args = process.argv.slice(2)
  initProxies(...args)
}

run()