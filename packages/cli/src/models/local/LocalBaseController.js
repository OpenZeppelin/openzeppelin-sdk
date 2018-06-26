import Stdlib from '../stdlib/Stdlib'
import Truffle from '../truffle/Truffle'
import { Contracts, Logger, FileSystem as fs } from 'zos-lib'
import ZosPackageFile from "../files/ZosPackageFile";

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
    // We are logging an error instead of throwing because a contract may have an empty constructor, 
    // which is fine, but as long as it is declared we will be picking it up
    const path = `${process.cwd()}/build/contracts/${contractName}.json`
    if (this.hasConstructor(path)) {
      log.error(`Contract ${contractName} has an explicit constructor. Move it to an initializer function to use it with ZeppelinOS.`)
    }
    this.packageFile.setContract(contractAlias, contractName)
  }

  addAll() {
    const folder = `${process.cwd()}/build/contracts`
    fs.readDir(folder).forEach(file => {
      const path = `${folder}/${file}`
      if(this.hasBytecode(path)) {
        const contractData = fs.parseJson(path)
        const contractName = contractData.contractName
        this.add(contractName, contractName)
      }
    })
  }

  validateImplementation(contractName) {
    // We are manually checking the build file instead of delegating to Contracts,
    // as Contracts requires initializing the entire truffle stack.
    const folder = `${process.cwd()}/build/contracts`
    const path = `${folder}/${contractName}.json`
    if (!fs.exists(path)) {
      throw Error(`Contract ${contractName} not found in folder ${folder}`)
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

  writePackage() {
    this.packageFile.write()
  }
}
