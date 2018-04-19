import PackageFilesInterface from '../utils/PackageFilesInterface'

const AppManager = {
  getImplementation: contractName => `${contractName}_contract_address`
}

const interface = new PackageFilesInterface();

function sync(network) {
  const zosPackage = interface.read()
  const zosNetworkFile = interface.readNetworkFile(network)

  zosNetworkFile.app.version = zosPackage.version

  delete zosPackage['version']
  zosNetworkFile.package = zosPackage

  for (let contractName in zosPackage.contracts) {
    zosNetworkFile.package.contracts[contractName] = AppManager.getImplementation(contractName)
  }

  interface.writeNetworkFile(network, zosNetworkFile)
}


function run() {
  const args = process.argv.slice(2)
  sync(...args)
}

run()
