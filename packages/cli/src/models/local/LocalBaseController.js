import _ from 'lodash'
import Session from '../network/Session'
import Truffle from '../truffle/Truffle'
import { Contracts, Logger, FileSystem as fs, getBuildArtifacts, validate as validateContract, validationPasses} from 'zos-lib'
import Dependency from '../dependency/Dependency';
import ValidationLogger from '../../interface/ValidationLogger';

const log = new Logger('LocalController');

const DEFAULT_VERSION = '0.1.0';

export default class LocalBaseController {
  constructor(packageFile) {
    this.packageFile = packageFile
  }

  get isLib() {
    return this.packageFile.isLib
  }

  init(name, version, force = false) {
    this.initZosPackageFile(name, version, force)
    Session.ignoreFile()
    Truffle.init()
  }

  initZosPackageFile(name, version, force = false) {
    if (this.packageFile.exists() && !force) {
      throw Error(`Cannot overwrite existing file ${this.packageFile.fileName}`)
    }
    if (this.packageFile.name && !force) {
      throw Error(`Cannot initialize already initialized package ${this.packageFile.name}`)
    }
    this.packageFile.name = name
    this.packageFile.version = version || DEFAULT_VERSION
    this.packageFile.contracts = {}
  }

  bumpVersion(version) {
    this.packageFile.version = version
  }

  add(contractAlias, contractName) {
    log.info(`Adding ${contractAlias === contractName ? contractAlias : `${contractAlias}:${contractName}`}`)
<<<<<<< HEAD
    // We are logging an error instead of throwing because a contract may have an empty constructor,
    // which is fine, but as long as it is declared we will be picking it up
    if (this.hasConstructor(Contracts.getLocalPath(contractName))) {
      log.error(`Contract ${contractName} has an explicit constructor. Move it to an initializer function to use it with ZeppelinOS.`)
    }
    // Log a warning anytime there is a base contract that wasn't initialized.
    const uninitializedBaseContracts = this.getUninitializedBaseContracts(Contracts.getLocalPath(contractName))
    for (const baseContractName in uninitializedBaseContracts) {
      const childContractName = uninitializedBaseContracts[baseContractName]
      log.warn(`Contract ${childContractName} has base contract ${baseContractName} that wasn't initialized.`)
    }
    // Log a warning anytime `selfdestruct` is found.  This is a potential security risk, 
    // but not an error/throw as it may be a desired feature
    if (this.hasSelfDestruct(Contracts.getLocalPath(contractName))) {
      log.warn(`Contract ${contractName} (or its parent class) has a selfdestruct call. This is potentially a security risk. Please review and consider removing this call.`)
    }
    // Log a warning anytime `delegatecall` is found.  This is a potential security risk, 
    // but not an error/throw as it may be a desired feature
    if (this.hasDelegateCall(Contracts.getLocalPath(contractName))) {
      log.warn(`Contract ${contractName} (or its parent class) has a delegatecall call. This is potentially a security risk, as the logic contract could be destructed by issuing a delegatecall to another contract with a selfdestruct instruction. Please review and consider removing this call.`)
    }
=======
>>>>>>> upstream/master
    this.packageFile.addContract(contractAlias, contractName)
  }

  addAll() {
    // TODO: hack to get local build dir, add this info to Contracts from zos-lib
    const folder = Contracts.getLocalPath('').replace(/\.json$/, '')
    fs.readDir(folder).forEach(file => {
      const path = `${folder}/${file}`
      if(this.hasBytecode(path)) {
        const contractData = fs.parseJson(path)
        const contractName = contractData.contractName
        this.add(contractName, contractName)
      }
    })
  }

  remove(contractAlias) {
    if (!this.packageFile.hasContract(contractAlias)) {
      log.error(`Contract ${contractAlias} to be removed was not found`)
    } else {
      log.info(`Removing ${contractAlias}`)
      this.packageFile.unsetContract(contractAlias)
    }
  }

  checkCanAdd(contractName) {
    const path = Contracts.getLocalPath(contractName)
    if (!fs.exists(path)) {
      throw Error(`Contract ${contractName} not found in path ${path}`)
    }
    if (!this.hasBytecode(path)) {
      throw Error(`Contract ${contractName} is abstract and cannot be deployed.`)
    }
  }

  validateAll() {
    const buildArtifacts = getBuildArtifacts();
    return _.every(_.map(this.packageFile.contractAliases, (contractAlias) => (
      this.validate(contractAlias, buildArtifacts)
    )));
  }

  validate(contractAlias, buildArtifacts) {
    const contractName = this.packageFile.contract(contractAlias);
    const contractClass = Contracts.getFromLocal(contractName || contractAlias);
    const warnings = validateContract(contractClass, {}, buildArtifacts);
    new ValidationLogger(contractClass).log(warnings, buildArtifacts);
    return validationPasses(warnings);
  }

  hasBytecode(contractDataPath) {
    if (!fs.exists(contractDataPath)) return false
    const bytecode = fs.parseJson(contractDataPath).bytecode
    return bytecode && bytecode !== "0x"
  }

  getContractClass(packageName, contractAlias) {
    if (!packageName || packageName === this.packageFile.name) {
      const contractName = this.packageFile.contract(contractAlias);
      return Contracts.getFromLocal(contractName);
    } else {
      const dependency = new Dependency(packageName)
      const contractName = dependency.getPackageFile().contract(contractAlias)
      return Contracts.getFromNodeModules(packageName, contractName)
    }
  }

  getContractSourcePath(contractAlias) {
    const contractName = this.packageFile.contract(contractAlias)
    if (contractName) {
      const contractDataPath = Contracts.getLocalPath(contractName)
      const { compiler, sourcePath } = fs.parseJson(contractDataPath)
      return { sourcePath, compilerVersion: compiler.version }
    } else {
      throw Error(`Could not find ${contractAlias} in contracts directory.`)
    }
  }

  writePackage() {
    this.packageFile.write()
  }
}
