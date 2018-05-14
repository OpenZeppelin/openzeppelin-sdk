import _ from 'lodash';
import { Logger } from 'zos-lib';
import Stdlib from './stdlib/Stdlib';
import NetworkAppController from './NetworkAppController';
import { FileSystem as fs, AppManagerProvider, AppManagerDeployer } from "zos-lib";

const log = new Logger('AppController');

const DEFAULT_VERSION = '0.1.0';

export default class AppController {
  constructor(packageFileName = 'package.zos.json') {
    this.packageFileName = packageFileName;
  }

  onNetwork(network, txParams, networkFileName) {
    return new NetworkAppController(this, network, txParams, networkFileName);
  }

  init(name, version) {
    if (fs.exists(this.packageFileName)) {
      throw Error(`Cannot overwrite existing file ${this.packageFileName}`)
    }
    if (this.package.name) {
      throw Error(`Cannot initialize already initialized package ${this.package.name}`)
    }
    
    this.package.name = name;
    this.package.version = version || DEFAULT_VERSION;
    this.package.contracts = {};
  }

  newVersion(version) {
    this.package.version = version;
  }

  async setStdlib(stdlibNameVersion, installDeps = false) {
    if (stdlibNameVersion) {
      const stdlib = new Stdlib(stdlibNameVersion);
      if (installDeps) await stdlib.install();
      this.package.stdlib = {
        name: stdlib.getName(),
        version: stdlib.getVersion()
      };
    }
  }

  hasStdlib() {
    return !_.isEmpty(this.package.stdlib);
  }

  addImplementation(contractAlias, contractName) {
    this.package.contracts[contractAlias] = contractName;
  }

  addAllImplementations() {
    const folder = `${process.cwd()}/build/contracts`
    fs.readDir(folder).forEach(file => {
      const path = `${folder}/${file}`
      if(this.hasBytecode(path)) {
        const contractData = fs.parseJson(path)
        const contractName = contractData.contractName
        this.addImplementation(contractName, contractName)
      }
    })
  }

  validateImplementation(contractName) {
    // We are manually checking the build file instead of delegating to ContractsProvider,
    // as ContractsProvider requires initializing the entire truffle stack.
    const folder = `${process.cwd()}/build/contracts`
    const path = `${folder}/${contractName}.json`
    if (!fs.exists(path)) {
      throw Error(`Contract ${contractName} not found in folder ${folder}`)
    }
    if (!this.hasBytecode(path)) {
      throw Error(`Contract ${contractName} is abstract and cannot be deployed as an implementation.`)
    }
  }

  hasBytecode(contractDataPath) {
    if (!fs.exists(contractDataPath)) return false
    const bytecode = fs.parseJson(contractDataPath).bytecode
    return bytecode && bytecode !== "0x"
  }

  get package() {
    if (!this._package) {
      this._package = fs.parseJsonIfExists(this.packageFileName) || {};
    }
    return this._package;
  }

  getContractClass(contractAlias) {
    const contractName = this.package.contracts[contractAlias];
    if (contractName) {
      return ContractsProvider.getFromArtifacts(contractName);
    } else if (this.hasStdlib()) {
      return ContractsProvider.getFromStdlib(this.package.stdlib.name, contractAlias);
    } else {
      throw Error(`Could not find ${contractAlias} contract in zOS project. Please provide one or make sure to set a stdlib that provides one.`);
    }
  }

  writePackage() {
    fs.writeJson(this.packageFileName, this.package);
    log.info(`Successfully written ${this.packageFileName}`)
  }
}
