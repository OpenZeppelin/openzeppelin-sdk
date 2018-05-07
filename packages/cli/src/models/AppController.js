import _ from 'lodash';
import { Logger } from 'zos-lib';
import { FileSystem as fs, AppManagerProvider, AppManagerDeployer } from "zos-lib";
import StdlibProvider from './stdlib/StdlibProvider';
import StdlibDeployer from './stdlib/StdlibDeployer';
import Stdlib from './stdlib/Stdlib';
import NetworkAppController from './NetworkAppController';

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
    if (this.package.name) {
      throw new Error(`Cannot initialize already initialized package ${this.package.name}`)
    }
    
    this.package.name = name;
    this.package.version = version || DEFAULT_VERSION;
    this.package.contracts = {};
  }

  newVersion(version) {
    if (!version) {
      throw new Error('Missign required argument version for initializing new version')
    }
    this.package.version = version;

    // TODO: Do not clean up contracts listing and stdlib, inherit from previous version
    this.package.contracts = {};
    delete this.package['stdlib'];
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
    // TODO: Add some extra metadata on the contract when adding it, and validate it exists
    this.package.contracts[contractAlias] = contractName;
  }

  get package() {
    if (!this._package) {
      this._package = fs.parseJsonIfExists(this.packageFileName) || {};
    }
    return this._package;
  }

  async getContractClass(contractAlias) {
    const contractName = this.package.contracts[contractAlias];
    if (contractName) {
      return ContractsProvider.getFromArtifacts(contractName);
    } else if (this.hasStdlib()) {
      return ContractsProvider.getFromStdlib(this.package.stdlib.name, contractAlias);
    } else {
      throw new Error(`Could not find ${contractAlias} contract in zOS package file`);
    }
  }

  writePackage() {
    fs.writeJson(this.packageFileName, this.package);
    log.info(`Successfully written ${this.packageFileName}`)
  }
}
