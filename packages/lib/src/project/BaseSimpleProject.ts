import { isEmpty } from 'lodash';

import Proxy from '../proxy/Proxy';
import { Loggy } from '../utils/Logger';
import Package from '../application/Package';
import Transactions from '../utils/Transactions';
import { toAddress } from '../utils/Addresses';
import { bytecodeDigest } from '../utils/Bytecode';
import { toSemanticVersion } from '../utils/Semver';
import { buildCallData, callDescription, CalldataInfo } from '../utils/ABIs';
import { ContractInterface } from './AppProject';
import Contract from '../artifacts/Contract';
import ProxyFactory from '../proxy/ProxyFactory';
import { TxParams } from '../artifacts/ZWeb3';

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

export default abstract class BaseSimpleProject {
  public implementations: Implementations;
  public dependencies: Dependencies;
  public txParams: TxParams;
  public name: string;
  public proxyFactory?: ProxyFactory;

  public constructor(name: string, proxyFactory?: ProxyFactory, txParams: TxParams = {}) {
    this.txParams = txParams;
    this.name = name;
    this.implementations = {};
    this.dependencies = {};
    this.proxyFactory = proxyFactory;
  }

  public abstract async getAdminAddress(): Promise<string>;

  public async setImplementation(contract: Contract, contractName?: string): Promise<any> {
    Loggy.onVerbose(
      __filename,
      'setImplementation',
      `set-implementation-for-${contract.schema.contractName}`,
      `Deploying logic contract for ${contract.schema.contractName}`,
    );
    if (!contractName) contractName = contract.schema.contractName;
    const implementation: any = await Transactions.deployContract(contract, [], this.txParams);
    await this.registerImplementation(contractName, {
      address: implementation.address,
      bytecodeHash: bytecodeDigest(contract.schema.linkedDeployedBytecode),
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
  // TS-TODO: review parameter type (it's packageName?+(contractName|contract))
  public async getImplementation({
    packageName,
    contractName,
    contract,
  }: {
    packageName?: string;
    contractName?: string;
    contract?: Contract;
  }): Promise<string | undefined> {
    contractName = contractName || contract.schema.contractName;
    return !packageName || packageName === this.name
      ? this.implementations[contractName] && this.implementations[contractName].address
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

  public async createProxy(
    contract,
    { packageName, contractName, initMethod, initArgs, redeployIfChanged, admin }: ContractInterface = {},
  ): Promise<Contract> {
    if (!isEmpty(initArgs) && !initMethod) initMethod = 'initialize';
    const implementationAddress = await this._getOrDeployImplementation(
      contract,
      packageName,
      contractName,
      redeployIfChanged,
    );
    const initCallData = this._getAndLogInitCallData(contract, initMethod, initArgs, implementationAddress, 'Creating');
    const proxyAdmin = admin || (await this.getAdminAddress());
    const proxy = await Proxy.deploy(implementationAddress, proxyAdmin, initCallData, this.txParams);
    Loggy.succeed(`create-proxy`, `Instance created at ${proxy.address}`);
    return contract.at(proxy.address);
  }

  public async createProxyWithSalt(
    contract,
    salt: string,
    signature?: string,
    { packageName, contractName, initMethod, initArgs, redeployIfChanged, admin }: ContractInterface = {},
  ): Promise<Contract> {
    if (!isEmpty(initArgs) && !initMethod) initMethod = 'initialize';
    const implementationAddress = await this._getOrDeployImplementation(
      contract,
      packageName,
      contractName,
      redeployIfChanged,
    );
    const initCallData = this._getAndLogInitCallData(contract, initMethod, initArgs, implementationAddress, 'Creating');

    const proxyFactory = await this.ensureProxyFactory();
    const adminAddress = admin || (await this.getAdminAddress());
    const proxy = await proxyFactory.createProxy(salt, implementationAddress, adminAddress, initCallData, signature);
    Loggy.succeed(`create-proxy`, `Instance created at ${proxy.address}`);
    return contract.at(proxy.address);
  }

  public async createMinimalProxy(
    contract,
    { packageName, contractName, initMethod, initArgs, redeployIfChanged }: ContractInterface = {},
  ): Promise<Contract> {
    if (!isEmpty(initArgs) && !initMethod) initMethod = 'initialize';
    const implementationAddress = await this._getOrDeployImplementation(
      contract,
      packageName,
      contractName,
      redeployIfChanged,
    );
    const initCallData = this._getAndLogInitCallData(contract, initMethod, initArgs, implementationAddress, 'Creating');

    const proxyFactory = await this.ensureProxyFactory();
    const proxy = await proxyFactory.createMinimalProxy(implementationAddress, initCallData);
    Loggy.succeed(`create-proxy`, `Instance created at ${proxy.address}`);
    return contract.at(proxy.address);
  }

  // REFACTOR: De-duplicate from AppProject
  public async getProxyDeploymentAddress(salt: string, sender?: string): Promise<string> {
    const proxyFactory = await this.ensureProxyFactory();
    return proxyFactory.getDeploymentAddress(salt, sender);
  }

  // REFACTOR: De-duplicate from AppProject and test
  public async getProxyDeploymentSigner(
    contract,
    salt: string,
    signature: string,
    { packageName, contractName, initMethod, initArgs, admin }: ContractInterface = {},
  ): Promise<string> {
    const proxyFactory = await this.ensureProxyFactory();
    const implementationAddress = await this.getImplementation({
      packageName,
      contractName,
      contract,
    });
    if (!implementationAddress)
      throw new Error(
        `Contract ${contractName ||
          contract.schema.contractName} was not found or is not deployed in the current network.`,
      );
    const adminAddress = admin || (await this.getAdminAddress());
    const initData = initMethod ? buildCallData(contract, initMethod, initArgs).callData : null;
    return proxyFactory.getSigner(salt, implementationAddress, adminAddress, initData, signature);
  }

  public async ensureProxyFactory(): Promise<ProxyFactory> {
    if (!this.proxyFactory) {
      this.proxyFactory = await ProxyFactory.deploy(this.txParams);
    }
    return this.proxyFactory;
  }

  private async _getOrDeployOwnImplementation(
    contract: Contract,
    contractName: string,
    redeployIfChanged?: boolean,
  ): Promise<string> {
    const existing: Implementation = this.implementations[contractName];
    const contractChanged: boolean =
      existing && existing.bytecodeHash !== bytecodeDigest(contract.schema.linkedDeployedBytecode);
    const shouldRedeploy: boolean = !existing || (redeployIfChanged && contractChanged);
    if (!shouldRedeploy) return existing.address;
    const newInstance: any = await this.setImplementation(contract, contractName);
    return newInstance.address;
  }

  private async _getDependencyImplementation(packageName: string, contractName: string): Promise<string | null> {
    if (!this.hasDependency(packageName)) return null;
    const { package: packageAddress, version }: Dependency = this.dependencies[packageName];
    const thepackage: Package = await Package.fetch(packageAddress, this.txParams);
    return thepackage.getImplementation(version, contractName);
  }

  protected async _setUpgradeParams(
    proxyAddress: string,
    contract: Contract,
    { packageName, contractName, initMethod: initMethodName, initArgs, redeployIfChanged }: ContractInterface = {},
  ): Promise<any> {
    const implementationAddress = await this._getOrDeployImplementation(
      contract,
      packageName,
      contractName,
      redeployIfChanged,
    );
    const initCallData = this._getAndLogInitCallData(
      contract,
      initMethodName,
      initArgs,
      implementationAddress,
      'Upgrading',
      proxyAddress,
    );
    return {
      initCallData,
      implementationAddress,
      pAddress: toAddress(proxyAddress),
    };
  }

  protected async _getOrDeployImplementation(
    contract: Contract,
    packageName: string,
    contractName?: string,
    redeployIfChanged?: boolean,
  ): Promise<string | never> {
    if (!contractName) contractName = contract.schema.contractName;

    const implementation =
      !packageName || packageName === this.name
        ? await this._getOrDeployOwnImplementation(contract, contractName, redeployIfChanged)
        : await this._getDependencyImplementation(packageName, contractName);

    if (!implementation) throw Error(`Could not retrieve or deploy contract ${packageName}/${contractName}`);
    return implementation;
  }

  protected _getAndLogInitCallData(
    contract: Contract,
    initMethodName?: string,
    initArgs?: string[],
    implementationAddress?: string,
    actionLabel?: string,
    proxyAddress?: string,
  ): string | null {
    const logReference = actionLabel === 'Creating' ? 'create-proxy' : `upgrade-proxy-${proxyAddress}`;
    const logMessage =
      actionLabel === 'Creating'
        ? `Creating instance for contract at ${implementationAddress}`
        : `Upgrading instance at ${proxyAddress}`;
    if (initMethodName) {
      const { method: initMethod, callData }: CalldataInfo = buildCallData(contract, initMethodName, initArgs);
      if (actionLabel)
        Loggy.spin(
          __filename,
          '_getAndLogInitCallData',
          logReference,
          `${logMessage} and calling ${callDescription(initMethod, initArgs)}`,
        );
      return callData;
    } else {
      if (actionLabel) Loggy.spin(__filename, '_getAndLogInitCallData', logReference, logMessage);
      return null;
    }
  }
}
