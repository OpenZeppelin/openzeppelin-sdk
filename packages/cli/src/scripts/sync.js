import _ from 'lodash'
import StdlibProvider from "../models/stdlib/StdlibProvider";
import ContractsProvider from '../zos-lib/utils/ContractsProvider'
import AppManagerProvider from "../zos-lib/app_manager/AppManagerProvider";
import AppManagerDeployer from "../zos-lib/app_manager/AppManagerDeployer";
import PackageFilesInterface from '../utils/PackageFilesInterface'
import Logger from '../utils/Logger'

const log = new Logger('sync')

export default async function sync({ network, deployStdlib, txParams = {}, packageFileName = null }) {
  const files = new PackageFilesInterface(packageFileName)
  if (! files.exists()) throw `Could not find package file ${packageFileName}`

  const zosPackage = files.read()
  let zosNetworkFile
  let appManager

  // Get AppManager instance
  if (files.existsNetworkFile(network)) {
    zosNetworkFile = files.readNetworkFile(network)
    appManager = await AppManagerProvider.from(zosNetworkFile.app.address, txParams)
  } else {
    appManager = await AppManagerDeployer.call(zosPackage.version, txParams)
    createNetworkFile(network, appManager.address(), packageFileName)
    zosNetworkFile = files.readNetworkFile(network)
  }

  if (zosPackage.version !== zosNetworkFile.app.version) {
    await appManager.newVersion(zosPackage.version)
    zosNetworkFile.app.version = zosPackage.version
  }

  const currentProvider = appManager.currentDirectory()
  zosNetworkFile.provider = { address: currentProvider.address }

  for (let contractAlias in zosPackage.contracts) {
    // TODO: store the implementation's hash to avoid unnecessary deployments
    const contractName = zosPackage.contracts[contractAlias];
    const contractClass = ContractsProvider.getFromArtifacts(contractName)
    const contractInstance = await appManager.setImplementation(contractClass, contractAlias)
    zosNetworkFile.contracts[contractAlias] = contractInstance.address
  }

  // If being called from deploy all, delegate to caller handling the stdlib deployment and flag as customDeploy
  if (!_.isEmpty(zosPackage.stdlib) && deployStdlib) {
    const stdlibAddress = await deployStdlib(appManager, zosPackage.stdlib.name)
    zosNetworkFile.stdlib = { address: stdlibAddress, customDeploy: true, ... zosPackage.stdlib }
  } else if (!_.isEmpty(zosPackage.stdlib)) {
    const networkStdlibInfo = zosNetworkFile.stdlib
    // If syncing on top of a custom deploy of a stdlib, link to that deploy
    if (networkStdlibInfo && networkStdlibInfo.customDeploy && networkStdlibInfo.name === zosPackage.stdlib.name) {
      log.info("Using existing custom deployment of stdlib")
      await appManager.setStdlib(networkStdlibInfo.address)
    // Otherwise, link to the public deployed version
    } else {
      log.info("Connecting to public deployment of stdlib")
      const stdlibAddress = StdlibProvider.from(zosPackage.stdlib.name, network);
      await appManager.setStdlib(stdlibAddress)
      zosNetworkFile.stdlib = { address: stdlibAddress, ... zosPackage.stdlib }
    }
  // If no stdlib requested, clear everything
  } else {
    delete zosNetworkFile['stdlib']
    await appManager.setStdlib()
  }

  files.writeNetworkFile(network, zosNetworkFile)
}

function createNetworkFile(network, address, packageFileName) {
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()

  const { version } = zosPackage
  delete zosPackage['version']
  delete zosPackage['name']

  const zosNetworkFile = {
    'app': { address, version },
    'proxies': {},
    ...zosPackage
  }

  files.writeNetworkFile(network, zosNetworkFile)
}
