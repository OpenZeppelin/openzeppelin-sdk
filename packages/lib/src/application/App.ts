import findLast from 'lodash.findlast';

import Logger from '../utils/Logger';
import copyContract from '../helpers/copyContract';
import Contracts from '../artifacts/Contracts';
import Package from '../application/Package';
import ImplementationDirectory from '../application/ImplementationDirectory';
import { isZeroAddress, toAddress } from '../utils/Addresses';
import { buildCallData, callDescription, CalldataInfo } from '../utils/ABIs';
import ContractFactory, { ContractWrapper } from '../artifacts/ContractFactory';
import { toSemanticVersion, semanticVersionEqual } from '../utils/Semver';
import { deploy as deployContract, sendTransaction, sendDataTransaction } from '../utils/Transactions';
import { TransactionReceipt } from 'web3/types';

const log: Logger = new Logger('App');

export default class App {

  public appContract: any;
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

  public async getPackage(name): Promise<{ package: Package, version: string }> {
    const { ['0']: address, ['1']: version } = await this.appContract.methods.getPackage(name).call();
    const thepackage = await Package.fetch(address, { ...this.txParams });
    return { package: thepackage, version };
  }

  public async hasPackage(name: string, expectedVersion?: string): Promise<boolean> {
    const { ['0']: address, ['1']: version } = await this.appContract.methods.getPackage(name).call();
    return !isZeroAddress(address) &&
      (!expectedVersion || semanticVersionEqual(expectedVersion, version));
  }

  public async setPackage(name: string, packageAddress: string, version: string): Promise<any> {
    return await sendTransaction(this.appContract.methods.setPackage, [name, toAddress(packageAddress), toSemanticVersion(version)], { ...this.txParams });
  }

  public async unsetPackage(name: string): Promise<any> {
    return await sendTransaction(this.appContract.methods.unsetPackage, [name], { ...this.txParams });
  }

  get address(): string {
    return this.appContract.address;
  }

  get contract(): ContractWrapper {
    return this.appContract;
  }

  public async getImplementation(packageName: string, contractName: string): Promise<string> {
    return this.appContract.methods.getImplementation(packageName, contractName).call();
  }

  public async getProxyImplementation(proxyAddress: string): Promise<string> {
    return this.appContract.methods.getProxyImplementation(proxyAddress).call({ ...this.txParams });
  }

  public async hasProvider(name: string): Promise<boolean> {
    return (await this.getProvider(name) != null);
  }

  public async getProvider(name: string): Promise<ImplementationDirectory> {
    const address = await this.appContract.methods.getProvider(name).call();
    if (isZeroAddress(address)) return null;
    return await ImplementationDirectory.fetch(address, { ...this.txParams });
  }

  public async changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void> {
    log.info(`Changing admin for proxy ${proxyAddress} to ${newAdmin}...`);
    await sendTransaction(this.appContract.methods.changeProxyAdmin, [proxyAddress, newAdmin], { ...this.txParams });
    log.info(`Admin for proxy ${proxyAddress} set to ${newAdmin}`);
  }

  public async createContract(contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs: string[]): Promise<ContractWrapper> {
    const instance = await this._copyContract(packageName, contractName, contractClass);
    await this._initNonUpgradeableInstance(instance, contractClass, packageName, contractName, initMethodName, initArgs);
    return instance;
  }

  public async createProxy(contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs?: string[]): Promise<ContractWrapper> {
    const receipt = typeof(initArgs) === 'undefined'
      ? await this._createProxy(packageName, contractName)
      : await this._createProxyAndCall(contractClass, packageName, contractName, initMethodName, initArgs);

    log.info(`TX receipt received: ${receipt.transactionHash}`);
    const event = receipt.events['ProxyCreated'];
    const address = Array.isArray(event) ? event[event.length - 1].returnValues.proxy : event.returnValues.proxy;
    log.info(`${packageName} ${contractName} proxy: ${address}`);
    return contractClass.at(address);
  }

  public async upgradeProxy(proxyAddress: string, contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs: any): Promise<ContractWrapper> {
    const receipt = typeof(initArgs) === 'undefined'
      ? await this._upgradeProxy(proxyAddress, packageName, contractName)
      : await this._upgradeProxyAndCall(proxyAddress, contractClass, packageName, contractName, initMethodName, initArgs);
    log.info(`TX receipt received: ${receipt.transactionHash}`);
    return contractClass.at(proxyAddress);
  }

  private async _createProxy(packageName: string, contractName: string): Promise<TransactionReceipt> {
    log.info(`Creating ${packageName} ${contractName} proxy without initializing...`);
    const initializeData: Buffer = Buffer.from('');
    return sendTransaction(this.appContract.methods.create, [packageName, contractName, initializeData], { ...this.txParams });
  }

  private async _createProxyAndCall(contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs: any): Promise<TransactionReceipt> {
    const { method: initMethod, callData }: CalldataInfo = buildCallData(contractClass, initMethodName, initArgs);
    log.info(`Creating ${packageName} ${contractName} proxy and calling ${callDescription(initMethod, initArgs)}`);
    return sendTransaction(this.appContract.methods.create, [packageName, contractName, callData], { ...this.txParams });
  }

  private async _upgradeProxy(proxyAddress: string, packageName: string, contractName: string): Promise<any> {
    log.info(`Upgrading ${packageName} ${contractName} proxy without running migrations...`);
    return sendTransaction(this.appContract.methods.upgrade, [proxyAddress, packageName, contractName], { ...this.txParams });
  }

  private async _upgradeProxyAndCall(proxyAddress: string, contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs: any): Promise<any> {
    const { method: initMethod, callData }: CalldataInfo = buildCallData(contractClass, initMethodName, initArgs);
    log.info(`Upgrading ${packageName} ${contractName} proxy and calling ${callDescription(initMethod, initArgs)}...`);
    return sendTransaction(this.appContract.methods.upgradeAndCall, [proxyAddress, packageName, contractName, callData], { ...this.txParams });
  }

  private async _copyContract(packageName: string, contractName: string, contractClass: ContractFactory): Promise<ContractWrapper> {
    log.info(`Creating new non-upgradeable instance of ${packageName} ${contractName}...`);
    const implementation: string = await this.getImplementation(packageName, contractName);
    const instance: ContractWrapper = await copyContract(contractClass, implementation, { ...this.txParams });
    log.info(`${packageName} ${contractName} instance created at ${instance.address}`);
    return instance;
  }

  private async _initNonUpgradeableInstance(instance: ContractWrapper, contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs?: string[]): Promise<any> {
    if (typeof(initArgs) !== 'undefined') {
      // this could be front-run, waiting for new initializers model
      const { method: initMethod, callData }: CalldataInfo = buildCallData(contractClass, initMethodName, initArgs);
      log.info(`Initializing ${packageName} ${contractName} instance at ${instance.address} by calling ${callDescription(initMethod, initArgs)}`);
      await sendDataTransaction(instance, Object.assign({}, { ...this.txParams }, { data: callData }));
    }
  }
}
