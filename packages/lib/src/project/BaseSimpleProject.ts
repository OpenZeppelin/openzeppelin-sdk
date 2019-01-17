import ZWeb3 from '../artifacts/ZWeb3';
import Proxy from '../proxy/Proxy';
import Logger from '../utils/Logger';
import Package from '../application/Package';
import { deploy } from '../utils/Transactions';
import { bytecodeDigest } from '..';
import { buildCallData, callDescription, CalldataInfo } from '../utils/ABIs';
import ContractFactory from '../artifacts/ContractFactory';

const log: Logger = new Logger('BaseSimpleProject');

interface Implementations {
  [contractName: string]: Implementation;
}

interface Implementation {
  address: string;
  bytecodeHash: string;
}

interface Dependencies {
  [packageName: string]: Dependency;
}

interface Dependency {
  package: string;
  version: string;
}

export default class BaseSimpleProject {
  public implementations: Implementations;
  public dependencies: Dependencies;
  protected txParams: any;
  public name: string;

  constructor(name, txParams) {
    this.txParams = txParams;
    this.name = name;
    this.implementations = {};
    this.dependencies = {};
  }

  public async setImplementation(contractClass: ContractFactory, contractName?: string): Promise<any> {
    log.info(`Deploying logic contract for ${contractClass.contractName}`);
    if (!contractName) contractName = contractClass.contractName;
    const implementation: any = await deploy(contractClass, [], this.txParams);
    await this.registerImplementation(contractName, {
      address: implementation.address,
      bytecodeHash: bytecodeDigest(contractClass.deployedBinary)
    });
    return implementation;
  }

  public unsetImplementation(contractName: string): void {
    delete this.implementations[contractName];
  }

  public async registerImplementation(contractName: string, { address, bytecodeHash }: Implementation): Promise<void> {
    this.implementations[contractName] = { address, bytecodeHash };
  }

  // TS-TODO: review return type
  public async getImplementation({ packageName, contractName }: { packageName?: string, contractName: string }): Promise<string | undefined> {
    return !packageName || packageName === this.name
      ? (this.implementations[contractName] && this.implementations[contractName].address)
      : this._getDependencyImplementation(packageName, contractName);
  }

  public async getDependencyPackage(name: string): Promise<Package> {
    return Package.fetch(this.dependencies[name].package);
  }

  public getDependencyVersion(name: string): string {
    return this.dependencies[name].version;
  }

  public hasDependency(name: string): boolean {
    return !!this.dependencies[name];
  }

  public setDependency(name: string, packageAddress: string, version: string): void {
    // TODO: Validate that the package exists and has thatversion
    this.dependencies[name] = { package: packageAddress, version };
  }

  public unsetDependency(name: string): void {
    delete this.dependencies[name];
  }

  public async _getOrDeployImplementation(contractClass: ContractFactory, packageName: string, contractName?: string, redeployIfChanged?: boolean): Promise<string | never> {
    if (!contractName) contractName = contractClass.contractName;

    const implementation = !packageName || packageName === this.name
      ? await this._getOrDeployOwnImplementation(contractClass, contractName, redeployIfChanged)
      : await this._getDependencyImplementation(packageName, contractName);

    if (!implementation) throw Error(`Could not retrieve or deploy contract ${packageName}/${contractName}`);
    return implementation;
  }

  public async _getOrDeployOwnImplementation(contractClass: ContractFactory, contractName: string, redeployIfChanged?: boolean): Promise<string> {
    const existing: Implementation = this.implementations[contractName];
    const contractChanged: boolean = existing && existing.bytecodeHash !== bytecodeDigest(contractClass.deployedBinary);
    const shouldRedeploy: boolean = !existing || (redeployIfChanged && contractChanged);
    if (!shouldRedeploy) return existing.address;
    const newInstance: any = await this.setImplementation(contractClass, contractName);
    return newInstance.address;
  }

  public async _getDependencyImplementation(packageName: string, contractName: string): Promise<string | null> {
    if (!this.hasDependency(packageName)) return null;
    const { package: packageAddress, version }: Dependency = this.dependencies[packageName];
    const thepackage: Package = await Package.fetch(packageAddress, this.txParams);
    return thepackage.getImplementation(version, contractName);
  }

  protected async getAdminAddress(): Promise<string> {
    return this.txParams.from || ZWeb3.defaultAccount()
  }

  protected getAndLogInitCallData(contractClass: ContractFactory, initMethodName?: string, initArgs?: string[], implementationAddress?: string, actionLabel?: string): string | null {
    if (initMethodName) {
      const { method: initMethod, callData }: CalldataInfo = buildCallData(contractClass, initMethodName, initArgs);
      log.info(`${actionLabel} proxy to logic contract ${implementationAddress} and initializing by calling ${callDescription(initMethod, initArgs)}`);
      return callData;
    } else {
      log.info(`${actionLabel} proxy to logic contract ${implementationAddress}`);
      return null;
    }
  }
}
