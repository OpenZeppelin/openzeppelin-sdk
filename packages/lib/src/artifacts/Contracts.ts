import fs from 'fs-extra';
import glob from 'glob';
import path from 'path';
import Contract, { createContract } from './Contract';
import ZWeb3 from './ZWeb3';
import { getSolidityLibNames, hasUnlinkedVariables } from '../utils/Bytecode';

import { ContractNotFound } from '../errors';

export default class Contracts {
  private static DEFAULT_BUILD_DIR = `build/contracts`;
  private static DEFAULT_CONTRACTS_DIR = `contracts`;

  private static buildDir: string = Contracts.DEFAULT_BUILD_DIR;
  private static contractsDir: string = Contracts.DEFAULT_CONTRACTS_DIR;
  private static projectRoot: string = null;
  private static artifactDefaults: any = {};
  private static defaultFromAddress: string;

  public static getLocalBuildDir(): string {
    return path.resolve(Contracts.buildDir || Contracts.DEFAULT_BUILD_DIR);
  }

  public static getLocalContractsDir(): string {
    return path.resolve(Contracts.contractsDir || Contracts.DEFAULT_CONTRACTS_DIR);
  }

  public static getProjectRoot(): string {
    return path.resolve(this.projectRoot || process.cwd());
  }

  public static async getDefaultTxParams(): Promise<any> {
    const defaults = { ...Contracts.getArtifactsDefaults() };
    if (!defaults.from) defaults.from = await Contracts.getDefaultFromAddress();
    return defaults;
  }

  public static getArtifactsDefaults(): any {
    return Contracts.artifactDefaults || {};
  }

  public static getLocalPath(contractName: string): string {
    return `${Contracts.getLocalBuildDir()}/${contractName}.json`;
  }

  public static getLibPath(contractName: string): string {
    return path.resolve(__dirname, `../../build/contracts/${contractName}.json`);
  }

  public static getNodeModulesPath(dependency: string, contractName: string): string {
    const root = this.getProjectRoot();
    try {
      return require.resolve(`${dependency}/build/contracts/${contractName}.json`, { paths: [root] });
    } catch (e) {
      throw new ContractNotFound(contractName, dependency);
    }
  }

  public static getFromLocal(contractName: string): Contract {
    return Contracts._getFromPath(Contracts.getLocalPath(contractName), contractName);
  }

  public static getFromLib(contractName: string): Contract {
    return Contracts._getFromPath(Contracts.getLibPath(contractName), contractName);
  }

  public static getFromNodeModules(dependency: string, contractName: string): Contract {
    return Contracts._getFromPath(Contracts.getNodeModulesPath(dependency, contractName), contractName);
  }

  public static async getDefaultFromAddress(): Promise<string> {
    if (!Contracts.defaultFromAddress) {
      Contracts.defaultFromAddress = await ZWeb3.defaultAccount();
    }
    return Contracts.defaultFromAddress;
  }

  public static listBuildArtifacts(pathName?: string): string[] {
    const buildDir = pathName || Contracts.getLocalBuildDir();
    return glob.sync(`${buildDir}/*.json`);
  }

  public static setLocalBuildDir(dir: string): void {
    Contracts.buildDir = dir;
  }

  public static setLocalContractsDir(dir: string): void {
    Contracts.contractsDir = dir;
  }

  public static setProjectRoot(dir: string): void {
    Contracts.projectRoot = dir;
  }

  public static setArtifactsDefaults(defaults: any): void {
    Contracts.artifactDefaults = {
      ...Contracts.getArtifactsDefaults(),
      ...defaults,
    };
  }

  private static _getFromPath(targetPath: string, contractName: string): Contract {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    if (!fs.existsSync(targetPath)) {
      throw new ContractNotFound(contractName);
    }
    const schema = fs.readJsonSync(targetPath);
    schema.directory = path.dirname(targetPath);
    if (schema.bytecode === '') throw new Error(`A bytecode must be provided for contract ${schema.contractName}.`);
    if (!hasUnlinkedVariables(schema.bytecode)) {
      schema.linkedBytecode = schema.bytecode;
      schema.linkedDeployedBytecode = schema.deployedBytecode;
    }
    return createContract(schema);
  }
}
