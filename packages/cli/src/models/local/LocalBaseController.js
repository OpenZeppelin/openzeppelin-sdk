import Stdlib from '../stdlib/Stdlib'
import Session from '../network/Session'
import Truffle from '../truffle/Truffle'
import { Contracts, Logger, FileSystem as fs } from 'zos-lib'

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
    // We are logging an error instead of throwing because a contract may have an empty constructor,
    // which is fine, but as long as it is declared we will be picking it up
    if (this.hasConstructor(Contracts.getLocalPath(contractName))) {
      log.error(`Contract ${contractName} has an explicit constructor. Move it to an initializer function to use it with ZeppelinOS.`)
    }
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

  validateImplementation(contractName) {
    const path = Contracts.getLocalPath(contractName)
    if (!fs.exists(path)) {
      throw Error(`Contract ${contractName} not found in path ${path}`)
    }
    if (!this.hasBytecode(path)) {
      throw Error(`Contract ${contractName} is abstract and cannot be deployed.`)
    }
  }

  hasBytecode(contractDataPath) {
    if (!fs.exists(contractDataPath)) return false
    const bytecode = fs.parseJson(contractDataPath).bytecode
    return bytecode && bytecode !== "0x"
  }

  hasConstructor(contractDataPath) {
    if (!fs.exists(contractDataPath)) return false
    const abi = fs.parseJson(contractDataPath).abi
    return !!abi.find(fn => fn.type === "constructor");
  }

  getContractClass(contractAlias) {
    const contractName = this.packageFile.contract(contractAlias);
    if (contractName) {
      return Contracts.getFromLocal(contractName);
    } else if (this.packageFile.hasStdlib()) {
      const stdlibName = this.packageFile.stdlibName;
      const contractName = new Stdlib(stdlibName).contract(contractAlias)
      return Contracts.getFromNodeModules(stdlibName, contractName);
    } else {
      throw Error(`Could not find ${contractAlias} contract in zOS project. Please provide one or make sure to set a stdlib that provides one.`);
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
