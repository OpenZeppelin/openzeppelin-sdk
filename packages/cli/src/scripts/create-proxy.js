import AppManager from '../models/AppManager'
import makeContract from '../utils/contract'
import PackageFilesInterface from '../utils/PackageFilesInterface'
import Stdlib from '../models/Stdlib';
import _ from 'lodash';

async function createProxy(contractAlias, { initArgs, network, from, packageFileName }) {
  if (contractAlias === undefined) throw 'Must provide a contract alias'

  // TODO: if network file does not exists, create it
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  const zosNetworkFile = files.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const appManager = new AppManager(from)
  await appManager.connect(zosNetworkFile.app.address)

  // Load contract from package manifest; if not found, try from stdlib
  let contractClass;
  const contractName = zosPackage.contracts[contractAlias]
  if (contractName) {
    contractClass = makeContract.local(contractName)
  } else if (zosPackage.stdlib && !_.isEmpty(zosPackage.stdlib)) {
    const stdlib = new Stdlib(zosPackage.stdlib)
    contractClass = await stdlib.getContract(contractAlias);
  } else {
    throw `Could not find ${contractAlias} contract in zOS package file`
  }
  
  // TODO: Support more than one initialize function
  // TODO: Support no initialization at all
  const proxyInstance = await appManager.createProxy(contractClass, contractAlias, 'initialize', initArgs)
  
  const { address } = proxyInstance
  const { version } = appManager

  proxies[contractAlias] = proxies[contractAlias] || []
  proxies[contractAlias].push({ address, version })

  zosNetworkFile.proxies = proxies
  files.writeNetworkFile(network, zosNetworkFile)
}

module.exports = createProxy
