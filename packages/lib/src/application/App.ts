import Logger from '../utils/Logger';
import Proxy from '../proxy/Proxy';
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

  public async hasProvider(name: string): Promise<boolean> {
    return (await this.getProvider(name) != null);
  }

  public async getProvider(name: string): Promise<ImplementationDirectory> {
    const address: string = await this.appContract.methods.getProvider(name).call();
    if (isZeroAddress(address)) return null;
    return await ImplementationDirectory.fetch(address, { ...this.txParams });
  }

  public async createContract(contractClass: ContractFactory, packageName: string, contractName: string, initMethodName: string, initArgs: string[]): Promise<ContractWrapper> {
    const instance = await this._copyContract(packageName, contractName, contractClass);
    await this._initNonUpgradeableInstance(instance, contractClass, packageName, contractName, initMethodName, initArgs);
    return instance;
  }

  public async createProxy(contractClass: ContractFactory, packageName: string, contractName: string, proxyAdmin: string, initMethodName: string, initArgs?: string[]): Promise<ContractWrapper> {
    const proxy = typeof(initArgs) === 'undefined'
      ? await this._createProxy(packageName, contractName, proxyAdmin)
      : await this._createProxyAndCall(contractClass, packageName, contractName, proxyAdmin, initMethodName, initArgs);
    log.info(`${packageName} ${contractName} proxy: ${proxy.address}`);
    return contractClass.at(proxy.address);
  }

  private async _createProxy(packageName: string, contractName: string, proxyAdmin: string): Promise<Proxy> {
    log.info(`Creating ${packageName} ${contractName} proxy without initializing...`);
    const initializeData: Buffer = Buffer.from('');
    const implementation = await this.getImplementation(packageName, contractName);
    return Proxy.deploy(implementation, proxyAdmin, initializeData, this.txParams);
  }

  private async _createProxyAndCall(contractClass: ContractFactory, packageName: string, contractName: string, proxyAdmin: string, initMethodName: string, initArgs: any): Promise<Proxy> {
    const { method: initMethod, callData }: CalldataInfo = buildCallData(contractClass, initMethodName, initArgs);
    log.info(`Creating ${packageName} ${contractName} proxy and calling ${callDescription(initMethod, initArgs)}`);
    const implementation = await this.getImplementation(packageName, contractName);
    return Proxy.deploy(implementation, proxyAdmin, callData, this.txParams);
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
