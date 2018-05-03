import PackageFilesInterface from '../utils/PackageFilesInterface'
import AppManagerProvider from "../zos-lib/app_manager/AppManagerProvider";

export default async function createProxy({ contractAlias, initMethod, initArgs, network, txParams = {}, packageFileName = null }) {
  if (contractAlias === undefined) throw 'Must provide a contract alias'

  // TODO: if network file does not exists, create it
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  const zosNetworkFile = files.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const appManager = await AppManagerProvider.from(zosNetworkFile.app.address, txParams)
  const contractClass = await files.getContractClass(zosPackage, contractAlias)
  const proxyInstance = await appManager.createProxy(contractClass, contractAlias, initMethod, initArgs)
  
  const { address } = proxyInstance
  const { version } = appManager

  proxies[contractAlias] = proxies[contractAlias] || []
  proxies[contractAlias].push({ address, version })

  zosNetworkFile.proxies = proxies
  files.writeNetworkFile(network, zosNetworkFile)
}

