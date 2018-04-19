import PackageFilesInterface from '../utils/PackageFilesInterface'
import { AppManager } from './models/AppManager'

const interface = new PackageFilesInterface()

async function createProxy(network, contractName, ...args) {
  // TODO: if network file does not exists, create it
  const zosNetworkFile = interface.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const contractClass = artifacts.require(contractName)
  const proxyInstance = await AppManager.createProxy(contractClass, contractName, args)

  const { address } = proxyInstance
  const version = proxyInstance.version()

  proxies[contractName] = proxies[contractName] || []
  proxies[contractName].push({ address, version })

  zosNetworkFile.proxies = proxies
  interface.writeNetworkFile(network, zosNetworkFile)
}


function run() {
  const args = process.argv.slice(2)
  createProxy(...args)
}

run()