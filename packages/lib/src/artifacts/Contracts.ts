import glob from 'glob';
import path from 'path';
import ZosContract from './ZosContract';
import ZWeb3 from './ZWeb3';

export interface ContractSchema {
  schemaVersion: string;
  contractName: string;
  abi: any[];
  bytecode: string;
  deployedBytecode: string;
  linkedBytecode: string;
  linkedDeployedBytecode: string;
  sourceMap: string;
  deployedSourceMap: string;
  source: string;
  sourcePath: string;
  ast: any;
  legacyAST: any;
  compiler: any;
  networks: any;
  updatedAt: string;
}

export default class Contracts {
  private static DEFAULT_SYNC_TIMEOUT: number = 240000;
  private static DEFAULT_BUILD_DIR: string = `${process.cwd()}/build/contracts`;
  private static DEFAULT_CONTRACTS_DIR: string = `${process.cwd()}/contracts`;

  private static timeout: number = Contracts.DEFAULT_SYNC_TIMEOUT;
  private static buildDir: string = Contracts.DEFAULT_BUILD_DIR;
  private static contractsDir: string = Contracts.DEFAULT_CONTRACTS_DIR;
  private static artifactDefaults: any = {};
  private static defaultFromAddress: string;

  public static getSyncTimeout(): number {
    return Contracts.timeout || Contracts.DEFAULT_SYNC_TIMEOUT;
  }

  public static getLocalBuildDir(): string {
    return Contracts.buildDir || Contracts.DEFAULT_BUILD_DIR;
  }

  public static getLocalContractsDir(): string {
    return Contracts.contractsDir || Contracts.DEFAULT_CONTRACTS_DIR;
  }

  public static async getDefaultTxParams(): Promise<any> {
    const defaultFrom = Contracts.defaultFromAddress ? Contracts.defaultFromAddress : await ZWeb3.defaultAccount();
    return { ...Contracts.getArtifactsDefaults(), from: defaultFrom };
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
    return `${process.cwd()}/node_modules/${dependency}/build/contracts/${contractName}.json`;
  }

  public static getFromLocal(contractName: string): ZosContract {
    return Contracts._getFromPath(Contracts.getLocalPath(contractName));
  }

  public static getFromLib(contractName: string): ZosContract {
    return Contracts._getFromPath(Contracts.getLibPath(contractName));
  }

  public static getFromNodeModules(dependency: string, contractName: string): ZosContract {
    return Contracts._getFromPath(Contracts.getNodeModulesPath(dependency, contractName));
  }

  public static listBuildArtifacts(): string[] {
    return glob.sync(`${Contracts.getLocalBuildDir()}/*.json`);
  }

  public static setSyncTimeout(value: number): void {
    Contracts.timeout = value;
  }

  public static setLocalBuildDir(dir: string): void {
    Contracts.buildDir = dir;
  }

  public static setLocalContractsDir(dir: string): void {
    Contracts.contractsDir = dir;
  }

  public static setArtifactsDefaults(defaults: any): void {
    Contracts.artifactDefaults = { ...Contracts.getArtifactsDefaults(), ...defaults };
  }

  private static _getFromPath(targetPath: string): ZosContract {
    const schema = require(targetPath);
    if(schema.bytecode === '') throw new Error(`A bytecode must be provided for contract ${schema.contractName}.`);
    return new ZosContract(schema);
  }
}
