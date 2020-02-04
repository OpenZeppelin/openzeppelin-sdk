import fs from 'fs-extra';
import { every, map } from 'lodash';
import {
  Contracts,
  Loggy,
  getBuildArtifacts,
  BuildArtifacts,
  validate as validateContract,
  validationPasses,
  TxParams,
} from '@openzeppelin/upgrades';

import Session from '../network/Session';
import Dependency from '../dependency/Dependency';
import NetworkController from '../network/NetworkController';
import ValidationLogger from '../../interface/ValidationLogger';
import ConfigManager from '../config/ConfigManager';
import ProjectFile from '../files/ProjectFile';
import NetworkFile from '../files/NetworkFile';
import ContractManager from './ContractManager';

const DEFAULT_VERSION = '0.1.0';

export default class LocalController {
  public projectFile: ProjectFile;

  public constructor(projectFile: ProjectFile = new ProjectFile(), init = false) {
    if (!init && !projectFile.exists()) {
      throw Error(
        `OpenZeppelin file ${projectFile.filePath} not found. Run 'openzeppelin init' first to initialize the project.`,
      );
    }
    this.projectFile = projectFile;
  }

  public init(name: string, version: string, force = false, publish = false): void | never {
    if (!name) throw Error('A project name must be provided to initialize the project.');
    this.initProjectFile(name, version, force, publish);
    Session.ignoreFile();
    ConfigManager.initialize();
  }

  public initProjectFile(name: string, version: string, force = false, publish: boolean): void | never {
    if (this.projectFile.exists() && !force) {
      throw Error(`Cannot overwrite existing file ${this.projectFile.filePath}`);
    }
    if (this.projectFile.name && !force) {
      throw Error(`Cannot initialize already initialized package ${this.projectFile.name}`);
    }
    this.projectFile.name = name;
    this.projectFile.version = version || DEFAULT_VERSION;
    this.projectFile.contracts = {};
    if (publish) this.projectFile.publish = publish;
    Loggy.noSpin(
      __filename,
      'initProjectFile',
      'init-project-file',
      `Project initialized. Write a new contract in the contracts folder and run 'openzeppelin create' to deploy it.`,
    );
  }

  public bumpVersion(version: string): void {
    this.projectFile.version = version;
  }

  public add(contractAlias: string, contractName: string): void {
    Loggy.spin(
      __filename,
      'add',
      `add-${contractAlias}`,
      `Adding ${contractAlias === contractName ? contractAlias : `${contractAlias}:${contractName}`}`,
    );
    this.projectFile.addContract(contractAlias, contractName);
    Loggy.succeed(`add-${contractAlias}`, `Added contract ${contractAlias}`);
  }

  public addAll(): void {
    const manager = new ContractManager(this.projectFile);
    manager.getContractNames().forEach(name => this.add(name, name));
  }

  public remove(contractAlias: string): void {
    if (!this.projectFile.hasContract(contractAlias)) {
      Loggy.noSpin.error(
        __filename,
        'remove',
        `remove-${contractAlias}`,
        `Contract ${contractAlias} to be removed was not found`,
      );
    } else {
      Loggy.spin(__filename, 'remove', `remove-${contractAlias}`, `Removing ${contractAlias}`);
      this.projectFile.unsetContract(contractAlias);
      Loggy.succeed(`remove-${contractAlias}`, `Removed contract ${contractAlias}`);
    }
  }

  public checkCanAdd(contractName: string): void | never {
    const path = Contracts.getLocalPath(contractName);
    if (!fs.existsSync(path)) {
      throw Error(`Contract ${contractName} not found in path ${path}`);
    }
    if (!this.hasBytecode(path)) {
      throw Error(`Contract ${contractName} is abstract and cannot be deployed.`);
    }
  }

  // Contract model
  public validateAll(): boolean {
    const buildArtifacts = getBuildArtifacts();
    return every(map(this.projectFile.contractAliases, contractAlias => this.validate(contractAlias, buildArtifacts)));
  }

  // Contract model
  public validate(contractAlias: string, buildArtifacts?: BuildArtifacts): boolean {
    const contractName = this.projectFile.contract(contractAlias);
    const contract = Contracts.getFromLocal(contractName || contractAlias);
    const warnings = validateContract(contract, {}, buildArtifacts);
    new ValidationLogger(contract).log(warnings, buildArtifacts);
    return validationPasses(warnings);
  }

  // Contract model
  public hasBytecode(contractDataPath: string): boolean {
    if (!fs.existsSync(contractDataPath)) return false;
    const bytecode = fs.readJsonSync(contractDataPath).bytecode;
    return bytecode && bytecode !== '0x';
  }

  // Contract model
  public getContractSourcePath(contractAlias: string): { sourcePath: string; compilerVersion: string } | never {
    const contractName = this.projectFile.contract(contractAlias);
    if (contractName) {
      const contractDataPath = Contracts.getLocalPath(contractName);
      const { compiler, sourcePath } = fs.readJsonSync(contractDataPath);
      return { sourcePath, compilerVersion: compiler.version };
    } else {
      throw Error(`Could not find ${contractAlias} in contracts directory.`);
    }
  }

  public writePackage(): void {
    this.projectFile.write();
  }

  // DependencyController
  public async linkDependencies(dependencies: string[], installDependencies = false): Promise<void> {
    const linkedDependencies = await Promise.all(
      dependencies.map(
        async (depNameVersion: string): Promise<string> => {
          const dependency = installDependencies
            ? await Dependency.install(depNameVersion)
            : Dependency.fromNameWithVersion(depNameVersion);
          this.projectFile.setDependency(dependency.name, dependency.requirement as string);
          return dependency.name;
        },
      ),
    );

    if (linkedDependencies.length > 0) {
      const label = linkedDependencies.length === 1 ? 'Dependency' : 'Dependencies';
      Loggy.noSpin(
        __filename,
        'linkDependencies',
        'link-dependencies',
        `${label} linked to the project. Run 'openzeppelin create' to deploy one of its contracts.`,
      );
    }
  }

  // DependencyController
  public unlinkDependencies(dependenciesNames: string[]): void {
    const unlinkedDependencies = dependenciesNames.map(dep => {
      const dependency = Dependency.fromNameWithVersion(dep);
      this.projectFile.unsetDependency(dependency.name);
      return dependency.name;
    });

    if (unlinkedDependencies.length > 0) {
      const label = unlinkedDependencies.length === 1 ? 'Dependency' : 'Dependencies';
      Loggy.noSpin(
        __filename,
        'linkDependencies',
        'link-dependencies',
        `${label} ${unlinkedDependencies.join(', ')} unlinked.`,
      );
    }
  }

  public onNetwork(network: string, txParams: TxParams, networkFile?: NetworkFile): NetworkController {
    return new NetworkController(network, txParams, networkFile);
  }
}
