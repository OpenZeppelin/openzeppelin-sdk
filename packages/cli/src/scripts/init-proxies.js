import PackageFilesInterface from '../utils/PackageFilesInterface'
import AppManager from '../models/AppManager'


async function initProxies({ network, from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()

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

  files.writeNetworkFile(network, zosNetworkFile)
}

export default initProxies