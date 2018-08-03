import { Contracts, Logger, App, FileSystem as fs } from 'zos-lib'
import { bytecodeDigest, bodyCode, constructorCode } from '../../utils/contracts'

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

  onMismatchingStdlib(expected, observed) {
    log.info(`Updating stdlib from ${expected} to ${observed}`)
    observed === 'none' ? this.networkFile.unsetStdlib() : this.networkFile.setStdlibAddress(observed)
  }

  onUnregisteredLocalContract(expected, observed, { alias, address }) {
    log.info(`Removing unregistered local contract ${alias} ${address}`)
    this.networkFile.removeContract(alias)
  }

  onMissingRemoteContract(expected, observed, { alias, address }) {
    const contractName = this.networkFile.packageFile.contract(alias) || alias
    log.info(`Adding contract ${contractName} at ${address}`)
    const buildPath = Contracts.getLocalPath(contractName)
    if(fs.exists(buildPath)) {
      const contract = Contracts.getFromLocal(contractName).at(address)
      const remoteBodyBytecode = web3.eth.getCode(address).replace(/^0x/, '')
      const bodyBytecodeHash = bytecodeDigest(remoteBodyBytecode)
      if(bodyCode(contract) === remoteBodyBytecode) {
        log.warn(`Assuming that constructor function of local version of ${contractName} is the one registered`)
        const constructor = constructorCode(contract)
        const bytecodeHash = bytecodeDigest(constructor + remoteBodyBytecode)
        this.networkFile.setContract(alias, { address, bytecodeHash, bodyBytecodeHash, constructorCode: constructor })
      }
      else {
        log.error(`Local version of ${contractName} has a different bytecode than the one stored at ${address}`)
        this.networkFile.setContract(alias, { address, bodyBytecodeHash, bytecodeHash: 'unknown', constructorCode: 'unknown' })
      }
    }
    else {
      log.error(`Cannot find a contract build file for ${contractName}`)
      this.networkFile.setContract(alias, { address, bytecodeHash: 'unknown', constructorCode: 'unknown' })
    }
  }

  onMismatchingContractAddress(expected, observed, { alias, address }) {
    log.info(`Updating address of contract ${alias} from ${expected} to ${observed}`)
    this.networkFile.setContractAddress(alias, address)
  }

  onMismatchingContractBodyBytecode(expected, observed, { alias, address, bodyBytecodeHash }) {
    log.info(`Updating bytecodeHash of contract ${alias} from ${expected} to ${observed}`)
    this.networkFile.setContractBodyBytecodeHash(alias, bodyBytecodeHash)
  }

  onUnregisteredLocalProxy(expected, observed, { alias, address, implementation }) {
    log.info(`Removing unregistered local proxy of ${alias} at ${address} pointing to ${implementation}`)
    this.networkFile.removeProxy(alias, address)
  }

  onMissingRemoteProxy(expected, observed, { alias, address, implementation }) {
    log.info(`Adding missing proxy of ${alias} at ${address} pointing to ${implementation}`)
    this.networkFile.addProxy(alias, { address, implementation, version: 'unknown' })
  }

  onMismatchingProxyAlias(expected, observed, { alias, address, implementation }) {
    log.info(`Changing alias of proxy at ${address} pointing to ${implementation} from ${expected} to ${observed}`)
    const proxy = this.networkFile.proxyByAddress(expected, address)
    this.networkFile.removeProxy(expected, address)
    this.networkFile.addProxy(alias, proxy)
  }

  onMismatchingProxyImplementation(expected, observed, { alias, address, implementation }) {
    log.info(`Changing implementation of proxy ${alias} at ${address} from ${expected} to ${observed}`)
    this.networkFile.setProxyImplementation(alias, address, implementation)
  }

  onUnregisteredProxyImplementation(expected, observed, { address, implementation }) {
    log.error(`Proxy at ${address} is pointing to ${implementation}, but given implementation is not registered in project`)
  }

  onMultipleProxyImplementations(expected, observed, { implementation }) {
    log.warn(`The same implementation address ${implementation} was registered under many aliases (${observed}). Please check them in the list of registered contracts.`)
  }
}
