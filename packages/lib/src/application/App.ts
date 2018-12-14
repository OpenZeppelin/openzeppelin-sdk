import _ from 'lodash';

import Logger from '../utils/Logger';
import decodeLogs from '../helpers/decodeLogs';
import copyContract from '../helpers/copyContract';
import Contracts from '../utils/Contracts';
import Package from '../package/Package';
import ImplementationDirectory from '../directory/ImplementationDirectory';
import { isZeroAddress, toAddress } from '../utils/Addresses';
import { buildCallData, callDescription, CalldataInfo } from '../utils/ABIs';
import ContractFactory, { ContractWrapper } from '../artifacts/ContractFactory';
import { toSemanticVersion, semanticVersionEqual } from '../utils/Semver';
import { deploy as deployContract, sendTransaction, sendDataTransaction } from '../utils/Transactions';

const log: any = new Logger('App');

export default class App {
  private appContract: any;
  private txParams: any;

  public static async fetch(address: string, txParams: any = {}): Promise<App> {
    const appContract: ContractWrapper = await this.getContractClass().at(address);
    return new this(appContract, txParams);
  }

  public static async deploy(txParams: any = {}): Promise<App> {
    log.info('Deploying new App...');
    const appContract: ContractWrapper = await deployContract(this.getContractClass(), [], txParams);
    log.info(`Deployed App at ${appContract.address}`);
    return new this(appContract, txParams);
  }

  public static getContractClass(): ContractFactory {
    return Contracts.getFromLib('App');
  }

  constructor(appContract: ContractWrapper, txParams: any = {}) {
    this.appContract = appContract;
    this.txParams = txParams;
  }

  public async getPackage(name): Promise<{ package: Package, version: any }> {
    const [address, version] = await this.appContract.getPackage(name);
    const thepackage = await Package.fetch(address, this.txParams);
    return { package: thepackage, version };
  }

  public async hasPackage(name: string, expectedVersion?: string): Promise<boolean> {
    const [address, version]: [string, string] = await this.appContract.getPackage(name);
    return !isZeroAddress(address) &&
      (!expectedVersion || semanticVersionEqual(expectedVersion, version));
  }

  public async setPackage(name: string, packageAddress: string, version: string): Promise<any> {
    return await sendTransaction(this.appContract.setPackage, [name, toAddress(packageAddress), toSemanticVersion(version)], this.txParams);
  }

  public async unsetPackage(name: string): Promise<any> {
    return await sendTransaction(this.appContract.unsetPackage, [name], this.txParams);
  }

  get address(): string {
    return this.appContract.address;
  }

  get contract(): ContractWrapper {
    return this.appContract;
  }

  public async getImplementation(packageName: string, contractName: string): Promise<string> {
    return this.appContract.getImplementation(packageName, contractName);
  }

  public async getProxyImplementation(proxyAddress: string): Promise<string> {
    return this.appContract.getProxyImplementation(proxyAddress, this.txParams);
  }

  public async hasProvider(name: string): Promise<boolean> {
    return (await this.getProvider(name) != null);
  }

  public async getProvider(name: string): Promise<ImplementationDirectory> {
    const address: string = await this.appContract.getProvider(name);
    if (isZeroAddress(address)) return null;
    return await ImplementationDirectory.fetch(address, this.txParams);
  }

  public async changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void> {
    log.info(`Changing admin for proxy ${proxyAddress} to ${newAdmin}...`);
    await sendTransaction(this.appContract.changeProxyAdmin, [proxyAddress, newAdmin], this.txParams);
    log.info(`Admin for proxy ${proxyAddress} set to ${newAdmin}`);
  }

  public async createContract(contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs: string[]): Promise<ContractWrapper> {
    const instance: ContractWrapper = await this._copyContract(packageName, contractName, contractClass);
    await this._initNonUpgradeableInstance(instance, contractClass, packageName, contractName, initMethodName, initArgs);
    return instance;
  }

  public async createProxy(contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs?: string[]): Promise<ContractWrapper> {
    const { receipt } = typeof(initArgs) === 'undefined'
      ? await this._createProxy(packageName, contractName)
      : await this._createProxyAndCall(contractClass, packageName, contractName, initMethodName, initArgs);

    log.info(`TX receipt received: ${receipt.transactionHash}`);
    const address: string = _.findLast(receipt.logs, (l) => l.event === 'ProxyCreated').args.proxy;
    log.info(`${packageName} ${contractName} proxy: ${address}`);
    return contractClass.at(address);
  }

  public async upgradeProxy(proxyAddress: string, contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs: any): Promise<ContractWrapper> {
    const { receipt }: any = typeof(initArgs) === 'undefined'
      ? await this._upgradeProxy(proxyAddress, packageName, contractName)
      : await this._upgradeProxyAndCall(proxyAddress, contractClass, packageName, contractName, initMethodName, initArgs);
    log.info(`TX receipt received: ${receipt.transactionHash}`);
    return contractClass.at(proxyAddress);
  }

  public async _createProxy(packageName: string, contractName: string): Promise<any> {
    log.info(`Creating ${packageName} ${contractName} proxy without initializing...`);
    const initializeData: string = '';
    return sendTransaction(this.appContract.create, [packageName, contractName, initializeData], this.txParams);
  }

  public async _createProxyAndCall(contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs: any): Promise<any> {
    const { method: initMethod, callData }: CalldataInfo = buildCallData(contractClass, initMethodName, initArgs);
    log.info(`Creating ${packageName} ${contractName} proxy and calling ${callDescription(initMethod, initArgs)}`);
    return sendTransaction(this.appContract.create, [packageName, contractName, callData], this.txParams);
  }

  public async _upgradeProxy(proxyAddress: string, packageName: string, contractName: string): Promise<any> {
    log.info(`Upgrading ${packageName} ${contractName} proxy without running migrations...`);
    return sendTransaction(this.appContract.upgrade, [proxyAddress, packageName, contractName], this.txParams);
  }

  public async _upgradeProxyAndCall(proxyAddress: string, contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs: any): Promise<any> {
    const { method: initMethod, callData }: CalldataInfo = buildCallData(contractClass, initMethodName, initArgs);
    log.info(`Upgrading ${packageName} ${contractName} proxy and calling ${callDescription(initMethod, initArgs)}...`);
    return sendTransaction(this.appContract.upgradeAndCall, [proxyAddress, packageName, contractName, callData], this.txParams);
  }

  public async _copyContract(packageName: string, contractName: string, contractClass: ContractFactory): Promise<ContractWrapper> {
    log.info(`Creating new non-upgradeable instance of ${packageName} ${contractName}...`);
    const implementation: string = await this.getImplementation(packageName, contractName);
    const instance: ContractWrapper = await copyContract(contractClass, implementation, this.txParams);
    log.info(`${packageName} ${contractName} instance created at ${instance.address}`);
    return instance;
  }

  public async _initNonUpgradeableInstance(instance: ContractWrapper, contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs?: string[]): Promise<any> {
    if (typeof(initArgs) !== 'undefined') {
      // this could be front-run, waiting for new initializers model
      const { method: initMethod, callData }: CalldataInfo = buildCallData(contractClass, initMethodName, initArgs);
      log.info(`Initializing ${packageName} ${contractName} instance at ${instance.address} by calling ${callDescription(initMethod, initArgs)}`);
      await sendDataTransaction(instance, Object.assign({}, this.txParams, {data: callData}));
    }
  }
}
