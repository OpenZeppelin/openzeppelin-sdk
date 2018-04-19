import PackageFilesInterface from '../utils/PackageFilesInterface'
import AppManager from '../models/AppManager'

const interface = new PackageFilesInterface()

async function initProxies({ network }) {
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
    zosNetworkFile.package.contracts[contractName] = await AppManager.getImplementation(contractName)
  }

  interface.writeNetworkFile(network, zosNetworkFile)
}

export default initProxies