import isEmpty from 'lodash.isempty';

import Proxy from '../proxy/Proxy';
import Logger from '../utils/Logger';
import Package from '../application/Package';
import { deploy } from '../utils/Transactions';
import { toAddress } from '../utils/Addresses';
import { bytecodeDigest } from '..';
import { buildCallData, callDescription, CalldataInfo } from '../utils/ABIs';
import ContractFactory, { ContractWrapper } from '../artifacts/ContractFactory';
import { ContractInterface } from './AppProject';
import { toSemanticVersion } from '../utils/Semver';

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

const log: Logger = new Logger('SimpleProject');

export default class SimpleProject  {
  public implementations: Implementations;
  public dependencies: Dependencies;
  public txParams: any;
  public name: string;

  constructor(name: string = 'main', txParams: any = {}) {
    this.txParams = txParams;
    this.name = name;
    this.implementations = {};
    this.dependencies = {};
  }

  public async createProxy(contractClass, { packageName, contractName, initMethod: initMethodName, initArgs, redeployIfChanged }: ContractInterface = {}): Promise<ContractWrapper> {
    if (!isEmpty(initArgs) && !initMethodName) initMethodName = 'initialize';
    const implementationAddress = await this._getOrDeployImplementation(contractClass, packageName, contractName, redeployIfChanged);
    const initCallData = this._getAndLogInitCallData(contractClass, initMethodName, initArgs, implementationAddress, 'Creating');
    const proxy = await Proxy.deploy(implementationAddress, initCallData, this.txParams);
    log.info(`Instance created at ${proxy.address}`);
    return contractClass.at(proxy.address);
  }

  public async upgradeProxy(proxyAddress: string, contractClass: ContractFactory, { packageName, contractName, initMethod: initMethodName, initArgs, redeployIfChanged }: ContractInterface = {}): Promise<ContractWrapper> {
    proxyAddress = toAddress(proxyAddress);
    const implementationAddress = await this._getOrDeployImplementation(contractClass, packageName, contractName, redeployIfChanged);
    const initCallData = this._getAndLogInitCallData(contractClass, initMethodName, initArgs, implementationAddress, 'Upgrading');
    const proxy = Proxy.at(proxyAddress, this.txParams);
    await proxy.upgradeTo(implementationAddress, initCallData);
    log.info(`Instance at ${proxyAddress} upgraded`);
    return contractClass.at(proxyAddress);
  }

  public async changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<Proxy> {
    const proxy: Proxy = Proxy.at(proxyAddress, this.txParams);
    await proxy.changeAdmin(newAdmin);
    log.info(`Proxy ${proxyAddress} admin changed to ${newAdmin}`);
    return proxy;
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

  public getDependencyVersion(name: string): [number, number, number] {
    return toSemanticVersion(this.dependencies[name].version);
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

  private _getAndLogInitCallData(contractClass: ContractFactory, initMethodName?: string, initArgs?: string[], implementationAddress?: string, actionLabel?: string): string | null {
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
