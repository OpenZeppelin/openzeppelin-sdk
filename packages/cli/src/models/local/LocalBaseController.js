import Stdlib from '../stdlib/Stdlib'
import Truffle from '../truffle/Truffle'
import { Contracts, Logger, FileSystem as fs } from 'zos-lib'

const log = new Logger('LocalController');

const DEFAULT_VERSION = '0.1.0';

export default class LocalBaseController {
  constructor(packageFileName = 'zos.json') {
    this.packageFileName = packageFileName;
  }

  init(name, version, force = false) {
    this.initZosFile(name, version, force)
    Truffle.init()
  }

  initZosFile(name, version, force = false) {
    if (fs.exists(this.packageFileName) && !force) {
      throw Error(`Cannot overwrite existing file ${this.packageFileName}`)
    }
    if (this.packageData.name && !force) {
      throw Error(`Cannot initialize already initialized package ${this.packageData.name}`)
    }

    this.packageData.name = name;
    this.packageData.version = version || DEFAULT_VERSION;
    this.packageData.contracts = {};
  }

  bumpVersion(version) {
    this.packageData.version = version;
  }

  hasStdlib() {
    return false;
  }

  add(contractAlias, contractName) {
    // We are logging an error instead of throwing because a contract may have an empty constructor, 
    // which is fine, but as long as it is declared we will be picking it up
    const path = `${process.cwd()}/build/contracts/${contractName}.json`
    if (this.hasConstructor(path)) {
      log.error(`Contract ${contractName} has an explicit constructor. Move it to an initializer function to use it with ZeppelinOS.`)
    }

    this.packageData.contracts[contractAlias] = contractName;
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

  get packageData() {
    if (!this._package) {
      this._package = fs.parseJsonIfExists(this.packageFileName) || {};
    }
    return this._package;
  }

  getContractClass(contractAlias) {
    const contractName = this.packageData.contracts[contractAlias];
    if (contractName) {
      return Contracts.getFromLocal(contractName);
    } else if (this.hasStdlib()) {
      const stdlibName = this.packageData.stdlib.name;
      const contractName = new Stdlib(stdlibName).contract(contractAlias)
      return Contracts.getFromNodeModules(stdlibName, contractName);
    } else {
      throw Error(`Could not find ${contractAlias} contract in zOS project. Please provide one or make sure to set a stdlib that provides one.`);
    }
  }

  writePackage() {
    fs.writeJson(this.packageFileName, this.packageData);
    log.info(`Successfully written ${this.packageFileName}`)
  }
}
