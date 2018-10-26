import { Contracts, Logger, FileSystem as fs, bytecodeDigest, bodyCode, constructorCode } from 'zos-lib'
import { promisify } from 'util';

const log = new Logger('StatusFetcher')

export default class StatusFetcher {
  constructor(networkFile) {
    this.networkFile = networkFile
  }

  onEndChecking() {
    log.info('Your project is up to date.')
  }

  onMismatchingVersion(expected, observed) {
    log.info(`Updating version from ${expected} to ${observed}`)
    this.networkFile.version = observed
  }

  onMismatchingPackage(expected, observed) {
    log.info(`Updating package from ${expected} to ${observed}`)
    this.networkFile.package = { address: observed }
  }

  onMismatchingProvider(expected, observed) {
    log.info(`Updating provider from ${expected} to ${observed}`)
    this.networkFile.provider = { address: observed }
  }

  onUnregisteredLocalImplementation(expected, observed, { alias, address }) {
    log.info(`Removing unregistered local contract ${alias} ${address}`)
    this.networkFile.unsetContract(alias)
  }

  async onMissingRemoteImplementation(expected, observed, { alias, address }) {
    const contractName = this.networkFile.packageFile.contract(alias) || alias
    log.info(`Adding contract ${contractName} at ${address}`)
    const buildPath = Contracts.getLocalPath(contractName)
    if(fs.exists(buildPath)) {
      const contract = Contracts.getFromLocal(contractName).at(address)
      const remoteBodyBytecode = (await promisify(web3.eth.getCode.bind(web3.eth))(address)).replace(/^0x/, '')
      const bodyBytecodeHash = bytecodeDigest(remoteBodyBytecode)
      if(bodyCode(contract) === remoteBodyBytecode) {
        log.warn(`Assuming that constructor function of local version of ${contractName} is the one registered`)
        const constructor = constructorCode(contract)
        const bytecodeHash = bytecodeDigest(`${constructor}${remoteBodyBytecode}`)
        this.networkFile.setContract(alias, { address, localBytecodeHash: bytecodeHash, deployedBytecodeHash: bytecodeHash, bodyBytecodeHash, constructorCode: constructor })
      }
      else {
        log.error(`Local version of ${contractName} has a different bytecode than the one stored at ${address}`)
        this.networkFile.setContract(alias, { address, bodyBytecodeHash, localBytecodeHash: 'unknown', deployedBytecodeHash: 'unknown', constructorCode: 'unknown' })
      }
    }
    else {
      log.error(`Cannot find a contract build file for ${contractName}`)
      this.networkFile.setContract(alias, { address, localBytecodeHash: 'unknown', deployedBytecodeHash: 'unknown', constructorCode: 'unknown' })
    }
  }

  onMismatchingImplementationAddress(expected, observed, { alias, address }) {
    log.info(`Updating address of contract ${alias} from ${expected} to ${observed}`)
    this.networkFile.updateImplementation(alias, (implementation) => ({ ...implementation, address }))
  }

  onMismatchingImplementationBodyBytecode(expected, observed, { alias, address, bodyBytecodeHash }) {
    log.info(`Updating bytecodeHash of contract ${alias} from ${expected} to ${observed}`)
    this.networkFile.updateImplementation(alias, (implementation) => ({ ...implementation, bodyBytecodeHash }))
  }

  onUnregisteredLocalProxy(expected, observed, { packageName, alias, address, implementation }) {
    log.info(`Removing unregistered local proxy of ${alias} at ${address} pointing to ${implementation}`)
    this.networkFile.removeProxy(packageName, alias, address)
  }

  onMissingRemoteProxy(expected, observed, { packageName, alias, address, implementation }) {
    log.info(`Adding missing proxy of ${alias} at ${address} pointing to ${implementation}`)
    this.networkFile.addProxy(packageName, alias, { address, version: 'unknown', implementation })
  }

  onMismatchingProxyAlias(expected, observed, { packageName, address, version, implementation }) {
    log.info(`Changing alias of package ${packageName} proxy at ${address} pointing to ${implementation} from ${expected} to ${observed}`)
    this.networkFile.removeProxy(packageName, expected, address)
    this.networkFile.addProxy(packageName, observed, { address, version, implementation })
  }

  onMismatchingProxyImplementation(expected, observed, { packageName, address, version, implementation, alias }) {
    log.info(`Changing implementation of proxy ${alias} at ${address} from ${expected} to ${observed}`)
    this.networkFile.updateProxy({ package: packageName, contract: alias, address }, (proxy) => ({ ...proxy, implementation: observed }))
  }

  onUnregisteredProxyImplementation(expected, observed, { address, implementation }) {
    log.error(`Proxy at ${address} is pointing to ${implementation}, but given implementation is not registered in project`)
  }

  onMultipleProxyImplementations(expected, observed, { implementation }) {
    log.warn(`The same implementation address ${implementation} was registered under many aliases (${observed}). Please check them in the list of registered contracts.`)
  }

  onMissingDependency(expected, observed, { name, address, version }) {
    log.info(`Adding missing dependency ${name} at ${address} with version ${version}`)
    this.networkFile.setDependency(name, { package: address, version: version })
  }

  onMismatchingDependencyAddress(expected, observed, { name, address }) {
    log.info(`Changing dependency ${name} package address from ${expected} to ${observed}`)
    this.networkFile.updateDependency(name, (dependency) => ({ ...dependency, package: observed }))
  }

  onMismatchingDependencyVersion(expected, observed, { name, version }) {
    log.info(`Changing dependency ${name} version from ${expected} to ${observed}`)
    this.networkFile.updateDependency(name, (dependency) =>({ ...dependency, version: observed }))
  }

  onUnregisteredDependency(expected, observed, { name, package: packageAddress }) {
    log.info(`Removing unregistered local dependency of ${name} at ${packageAddress}`)
    this.networkFile.unsetDependency(name)
  }
}
