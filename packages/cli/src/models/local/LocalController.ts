'use strict';

import every from 'lodash.every';
import map from 'lodash.map';
import { Contracts, Contract, Logger, FileSystem as fs, getBuildArtifacts, BuildArtifacts, validate as validateContract, validationPasses} from 'zos-lib';

import Session from '../network/Session';
import Dependency from '../dependency/Dependency';
import NetworkController from '../network/NetworkController';
import ValidationLogger from '../../interface/ValidationLogger';
import TruffleProjectInitializer from '../initializer/truffle/TruffleProjectInitializer';
import ZosPackageFile from '../files/ZosPackageFile';
import ZosNetworkFile from '../files/ZosNetworkFile';

const log = new Logger('LocalController');

const DEFAULT_VERSION = '0.1.0';

export default class LocalController {

  public packageFile: ZosPackageFile;

  constructor(packageFile: ZosPackageFile) {
    this.packageFile = packageFile;
  }

  public init(name: string, version: string, force: boolean = false, publish: boolean = false): void {
    this.initZosPackageFile(name, version, force);
    Session.ignoreFile();
    TruffleProjectInitializer.call();
    if (publish) this.packageFile.publish = publish;
  }

  public initZosPackageFile(name: string, version: string, force: boolean = false): void | never {
    if (this.packageFile.exists() && !force) {
      throw Error(`Cannot overwrite existing file ${this.packageFile.fileName}`);
    }
    if (this.packageFile.name && !force) {
      throw Error(`Cannot initialize already initialized package ${this.packageFile.name}`);
    }
    this.packageFile.name = name;
    this.packageFile.version = version || DEFAULT_VERSION;
    this.packageFile.contracts = {};
  }

  public bumpVersion(version: string): void {
    this.packageFile.version = version;
  }

  public add(contractAlias: string, contractName: string): void {
    log.info(`Adding ${contractAlias === contractName ? contractAlias : `${contractAlias}:${contractName}`}`);
    this.packageFile.addContract(contractAlias, contractName);
  }

  public addAll(): void {
    const folder = Contracts.getLocalBuildDir();
    fs.readDir(folder).forEach((file) => {
      const path = `${folder}/${file}`;
      if(this.hasBytecode(path)) {
        const contractData = fs.parseJson(path);
        const contractName = contractData.contractName;
        this.add(contractName, contractName);
      }
    });
  }

  public remove(contractAlias: string): void {
    if (!this.packageFile.hasContract(contractAlias)) {
      log.error(`Contract ${contractAlias} to be removed was not found`);
    } else {
      log.info(`Removing ${contractAlias}`);
      this.packageFile.unsetContract(contractAlias);
    }
  }

  public checkCanAdd(contractName: string): void | never {
    const path = Contracts.getLocalPath(contractName);
    if (!fs.exists(path)) {
      throw Error(`Contract ${contractName} not found in path ${path}`);
    }
    if (!this.hasBytecode(path)) {
      throw Error(`Contract ${contractName} is abstract and cannot be deployed.`);
    }
  }

  // Contract model
  public validateAll(): boolean {
    const buildArtifacts = getBuildArtifacts();
    return every(map(this.packageFile.contractAliases, (contractAlias) => (
      this.validate(contractAlias, buildArtifacts)
    )));
  }

  // Contract model
  public validate(contractAlias: string, buildArtifacts?: BuildArtifacts): boolean {
    const contractName = this.packageFile.contract(contractAlias);
    const contract = Contracts.getFromLocal(contractName || contractAlias);
    const warnings = validateContract(contract, {}, buildArtifacts);
    new ValidationLogger(contract).log(warnings, buildArtifacts);
    return validationPasses(warnings);
  }

  // Contract model
  public hasBytecode(contractDataPath: string): boolean {
    if (!fs.exists(contractDataPath)) return false;
    const bytecode = fs.parseJson(contractDataPath).bytecode;
    return bytecode && bytecode !== '0x';
  }

  // Contract model
  public getContractClass(packageName: string, contractAlias: string): Contract {
    if (!packageName || packageName === this.packageFile.name) {
      const contractName = this.packageFile.contract(contractAlias);
      return Contracts.getFromLocal(contractName);
    } else {
      const dependency = new Dependency(packageName);
      const contractName = dependency.getPackageFile().contract(contractAlias);
      return Contracts.getFromNodeModules(packageName, contractName);
    }
  }

  // Contract model
  public getContractSourcePath(contractAlias: string): { sourcePath: string, compilerVersion: string } | never {
    const contractName = this.packageFile.contract(contractAlias);
    if (contractName) {
      const contractDataPath = Contracts.getLocalPath(contractName);
      const { compiler, sourcePath } = fs.parseJson(contractDataPath);
      return { sourcePath, compilerVersion: compiler.version };
    } else {
      throw Error(`Could not find ${contractAlias} in contracts directory.`);
    }
  }

  public writePackage(): void {
    this.packageFile.write();
  }

  // DependencyController
  public async linkDependencies(dependencies: string[], installDependencies: boolean = false): Promise<void> {
    await Promise.all(dependencies.map(async (depNameVersion: string) => {
      const dependency = installDependencies
        ? await Dependency.install(depNameVersion)
        : Dependency.fromNameWithVersion(depNameVersion);
      this.packageFile.setDependency(dependency.name, <string>dependency.requirement);
    }));
  }

  // DependencyController
  public unlinkDependencies(dependenciesNames: string[]): void {
    dependenciesNames
      .map((dep) => Dependency.fromNameWithVersion(dep))
      .forEach((dep) => this.packageFile.unsetDependency(dep.name));
  }

  public onNetwork(network: string, txParams: any, networkFile?: ZosNetworkFile): NetworkController {
    return new NetworkController(this, network, txParams, networkFile);
  }
}
