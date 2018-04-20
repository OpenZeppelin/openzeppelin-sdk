import AppManager from '../models/AppManager'
import PackageFilesInterface from '../utils/PackageFilesInterface'

async function upgradeProxy(contractAlias, proxyAddress, { initMethod, initArgs, network, from, packageFileName }) {
  if (contractAlias === undefined) throw `Must provide a contract name`

  // TODO: if network file does not exists, create it
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  const zosNetworkFile = files.readNetworkFile(network)
  const { proxies } = zosNetworkFile
  if (!proxies[contractAlias] || proxies[contractAlias].length == 0) throw `No proxies for ${contractAlias}`

  if (proxies[contractAlias].length > 1 && proxyAddress === undefined) throw `Must provide a proxy address for contracts that have more than one proxy`
  let index = 0;
  if(proxies[contractAlias].length > 1) {
    index = proxies[contractAlias].findIndex(proxy => proxy.address === proxyAddress)
    if (index === undefined) throw `Could not find a ${contractAlias} proxy with address ${proxyAddress}`
  }
  else {
    proxyAddress = proxies[contractAlias][0].address;
  }

  const appManager = new AppManager(from)
  await appManager.connect(zosNetworkFile.app.address)

  const contractClass = await files.getContractClass(zosPackage, contractAlias)
  await appManager.upgradeProxy(proxyAddress, contractClass, contractAlias, initMethod, initArgs)

  proxies[contractAlias][index].version = appManager.version
  zosNetworkFile.proxies = proxies
  files.writeNetworkFile(network, zosNetworkFile)
}

module.exports = upgradeProxy
