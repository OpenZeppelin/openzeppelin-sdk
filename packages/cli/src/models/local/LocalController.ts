'use strict';

import every from 'lodash.every';
import map from 'lodash.map';
import {
  Contracts,
  Loggy,
  FileSystem as fs,
  getBuildArtifacts,
  BuildArtifacts,
  validate as validateContract,
  validationPasses,
  TxParams,
} from 'zos-lib';

import Session from '../network/Session';
import Dependency from '../dependency/Dependency';
import NetworkController from '../network/NetworkController';
import ValidationLogger from '../../interface/ValidationLogger';
import ConfigManager from '../config/ConfigManager';
import ZosPackageFile from '../files/ZosPackageFile';
import ZosNetworkFile from '../files/ZosNetworkFile';
import ContractManager from './ContractManager';

const DEFAULT_VERSION = '0.1.0';

export default class LocalController {
  public packageFile: ZosPackageFile;

  public constructor(
    packageFile: ZosPackageFile = new ZosPackageFile(),
    init: boolean = false,
  ) {
    if (!init && !packageFile.exists()) {
      throw Error(
        `ZeppelinOS file ${
          packageFile.fileName
        } not found. Run 'zos init' first to initialize the project.`,
      );
    }
    this.packageFile = packageFile;
  }

  public init(
    name: string,
    version: string,
    force: boolean = false,
    publish: boolean = false,
  ): void | never {
    if (!name)
      throw Error('A project name must be provided to initialize the project.');
    this.initZosPackageFile(name, version, force, publish);
    Session.ignoreFile();
    ConfigManager.initialize();
  }

  public initZosPackageFile(
    name: string,
    version: string,
    force: boolean = false,
    publish: boolean,
  ): void | never {
    if (this.packageFile.exists() && !force) {
      throw Error(
        `Cannot overwrite existing file ${this.packageFile.fileName}`,
      );
    }
    if (this.packageFile.name && !force) {
      throw Error(
        `Cannot initialize already initialized package ${
          this.packageFile.name
        }`,
      );
    }
    this.packageFile.name = name;
    this.packageFile.version = version || DEFAULT_VERSION;
    this.packageFile.contracts = {};
    if (publish) this.packageFile.publish = publish;
    Loggy.noSpin(
      __filename,
      'initZosPackageFile',
      'init-package-file',
      `Project successfully initialized. Write a new contract in the contracts folder and run 'zos create' to deploy it!`,
    );
  }

  public bumpVersion(version: string): void {
    this.packageFile.version = version;
  }

  public add(contractAlias: string, contractName: string): void {
    Loggy.spin(
      __filename,
      'add',
      `add-${contractAlias}`,
      `Adding ${
        contractAlias === contractName
          ? contractAlias
          : `${contractAlias}:${contractName}`
      }`,
    );
    this.packageFile.addContract(contractAlias, contractName);
    Loggy.succeed(`add-${contractAlias}`);
  }

  public addAll(): void {
    const manager = new ContractManager(this.packageFile);
    manager.getContractNames().forEach(name => this.add(name, name));
  }

  public remove(contractAlias: string): void {
    if (!this.packageFile.hasContract(contractAlias)) {
      Loggy.noSpin.error(
        __filename,
        'remove',
        `remove-${contractAlias}`,
        `Contract ${contractAlias} to be removed was not found`,
      );
    } else {
      Loggy.spin(
        __filename,
        'remove',
        `remove-${contractAlias}`,
        `Removing ${contractAlias}`,
      );
      this.packageFile.unsetContract(contractAlias);
      Loggy.succeed(`remove-${contractAlias}`);
    }
  }

  public checkCanAdd(contractName: string): void | never {
    const path = Contracts.getLocalPath(contractName);
    if (!fs.exists(path)) {
      throw Error(`Contract ${contractName} not found in path ${path}`);
    }
    if (!this.hasBytecode(path)) {
      throw Error(
        `Contract ${contractName} is abstract and cannot be deployed.`,
      );
    }
  }

  // Contract model
  public validateAll(): boolean {
    const buildArtifacts = getBuildArtifacts();
    return every(
      map(this.packageFile.contractAliases, contractAlias =>
        this.validate(contractAlias, buildArtifacts),
      ),
    );
  }

  // Contract model
  public validate(
    contractAlias: string,
    buildArtifacts?: BuildArtifacts,
  ): boolean {
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
  public getContractSourcePath(
    contractAlias: string,
  ): { sourcePath: string; compilerVersion: string } | never {
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
  public async linkDependencies(
    dependencies: string[],
    installDependencies: boolean = false,
  ): Promise<void> {
    const linkedDependencies = await Promise.all(
      dependencies.map(async (depNameVersion: string) => {
        const dependency = installDependencies
          ? await Dependency.install(depNameVersion)
          : Dependency.fromNameWithVersion(depNameVersion);
        this.packageFile.setDependency(
          dependency.name,
          dependency.requirement as string,
        );
        return dependency.name;
      }),
    );

    if (linkedDependencies.length > 0) {
      const label =
        linkedDependencies.length === 1 ? 'Dependency' : 'Dependencies';
      Loggy.noSpin(
        __filename,
        'linkDependencies',
        'link-dependencies',
        `${label} successfully linked to the project. Run 'zos create' to deploy one of its contracts!`,
      );
    }
  }

  // DependencyController
  public unlinkDependencies(dependenciesNames: string[]): void {
    const unlinkedDependencies = dependenciesNames.map(dep => {
      const dependency = Dependency.fromNameWithVersion(dep);
      this.packageFile.unsetDependency(dependency.name);
      return dependency.name;
    });

    if (unlinkedDependencies.length > 0) {
      const label =
        unlinkedDependencies.length === 1 ? 'Dependency' : 'Dependencies';
      Loggy.noSpin(
        __filename,
        'linkDependencies',
        'link-dependencies',
        `${label} ${unlinkedDependencies.join(', ')} successfully unlinked.`,
      );
    }
  }

  public onNetwork(
    network: string,
    txParams: TxParams,
    networkFile?: ZosNetworkFile,
  ): NetworkController {
    return new NetworkController(network, txParams, networkFile);
  }
}
