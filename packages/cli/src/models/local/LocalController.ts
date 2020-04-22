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
    if (publish) this.projectFile.publish = publish;
    Loggy.noSpin(
      __filename,
      'initProjectFile',
      'init-project-file',
      `Project initialized. Write a new contract in the contracts folder and run 'openzeppelin deploy' to deploy it.`,
    );
  }

  public bumpVersion(version: string): void {
    this.projectFile.version = version;
  }

  public add(contractName: string): void {
    Loggy.spin(__filename, 'add', `add-${contractName}`, `Adding ${contractName}`);
    this.projectFile.addContract(contractName);
    Loggy.succeed(`add-${contractName}`, `Added contract ${contractName}`);
  }

  public addAll(): void {
    const manager = new ContractManager(this.projectFile);
    manager.getContractNames().forEach(name => this.add(name));
  }

  public remove(contractName: string): void {
    if (!this.projectFile.hasContract(contractName)) {
      Loggy.noSpin.error(
        __filename,
        'remove',
        `remove-${contractName}`,
        `Contract ${contractName} to be removed was not found`,
      );
    } else {
      Loggy.spin(__filename, 'remove', `remove-${contractName}`, `Removing ${contractName}`);
      this.projectFile.removeContract(contractName);
      Loggy.succeed(`remove-${contractName}`, `Removed contract ${contractName}`);
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
    return every(map(this.projectFile.contracts, contractName => this.validate(contractName, buildArtifacts)));
  }

  // Contract model
  public validate(contractName: string, buildArtifacts?: BuildArtifacts): boolean {
    const contract = Contracts.getFromLocal(contractName).upgradeable;
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
  public getContractSourcePath(contractName: string): { sourcePath: string; compilerVersion: string } | never {
    try {
      const contractDataPath = Contracts.getLocalPath(contractName);
      const { compiler, sourcePath } = fs.readJsonSync(contractDataPath);
      return { sourcePath, compilerVersion: compiler.version };
    } catch (error) {
      error.message = `$Could not find ${contractName} in contracts directory. Error: ${error.message}.`;
      throw error;
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
        `${label} linked to the project. Run 'openzeppelin deploy' to deploy one of its contracts.`,
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
