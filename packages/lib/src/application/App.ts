import Logger from '../utils/Logger';
import Proxy from '../proxy/Proxy';
import copyContract from '../helpers/copyContract';
import Contracts from '../artifacts/Contracts';
import Package from '../application/Package';
import ImplementationDirectory from '../application/ImplementationDirectory';
import { isZeroAddress, toAddress } from '../utils/Addresses';
import { buildCallData, callDescription, CalldataInfo } from '../utils/ABIs';
import Contract from '../artifacts/Contract';
import { toSemanticVersion, semanticVersionEqual } from '../utils/Semver';
import Transactions from '../utils/Transactions';

const log: Logger = new Logger('App');

export default class App {
  public appContract: any;
  private txParams: any;

  public static async fetch(address: string, txParams: any = {}): Promise<App> {
    const appContract = (await this.getContractClass()).at(address);
    return new this(appContract, txParams);
  }

  public static async deploy(txParams: any = {}): Promise<App> {
    log.info('Deploying new App...');
    const appContract = await Transactions.deployContract(this.getContractClass(), [], txParams);
    log.info(`Deployed App at ${appContract.address}`);
    return new this(appContract, txParams);
  }

  public static getContractClass(): Contract {
    return Contracts.getFromLib('App');
  }

  constructor(appContract: Contract, txParams: any = {}) {
    this.appContract = appContract;
    this.txParams = txParams;
  }

  public async getPackage(name): Promise<{ package: Package, version: string }> {
    const { ['0']: address, ['1']: version } = await this.appContract.methods.getPackage(name).call();
    const thepackage = Package.fetch(address, { ...this.txParams });
    return { package: thepackage, version };
  }

  public async hasPackage(name: string, expectedVersion?: string): Promise<boolean> {
    const { ['0']: address, ['1']: version } = await this.appContract.methods.getPackage(name).call();
    return !isZeroAddress(address) &&
      (!expectedVersion || semanticVersionEqual(expectedVersion, version));
  }

  public async setPackage(name: string, packageAddress: string, version: string): Promise<any> {
    return await Transactions.sendTransaction(this.appContract.methods.setPackage, [name, toAddress(packageAddress), toSemanticVersion(version)], { ...this.txParams });
  }

  public async unsetPackage(name: string): Promise<any> {
    return await Transactions.sendTransaction(this.appContract.methods.unsetPackage, [name], { ...this.txParams });
  }

  get address(): string {
    return this.appContract.address;
  }

  get contract(): Contract {
    return this.appContract;
  }

  public async getImplementation(packageName: string, contractName: string): Promise<string> {
    return this.appContract.methods.getImplementation(packageName, contractName).call();
  }

  public async hasProvider(name: string): Promise<boolean> {
    return (await this.getProvider(name) != null);
  }

  public async getProvider(name: string): Promise<ImplementationDirectory> {
    const address = await this.appContract.methods.getProvider(name).call();
    if (isZeroAddress(address)) return null;
    return ImplementationDirectory.fetch(address, { ...this.txParams });
  }

  public async createContract(contract: Contract, packageName: string, contractName: string, initMethodName: string, initArgs: string[]): Promise<Contract> {
    const instance = await this._copyContract(packageName, contractName, contract);
    await this._initNonUpgradeableInstance(instance, contract, packageName, contractName, initMethodName, initArgs);
    return instance;
  }

  public async createProxy(contract: Contract, packageName: string, contractName: string, proxyAdmin: string, initMethodName: string, initArgs?: string[]): Promise<Contract> {
    const proxy = typeof(initArgs) === 'undefined'
      ? await this._createProxy(packageName, contractName, proxyAdmin)
      : await this._createProxyAndCall(contract, packageName, contractName, proxyAdmin, initMethodName, initArgs);
    log.info(`${packageName} ${contractName} proxy: ${proxy.address}`);
    return contract.at(proxy.address);
  }

  private async _createProxy(packageName: string, contractName: string, proxyAdmin: string): Promise<Proxy> {
    log.info(`Creating ${packageName} ${contractName} proxy without initializing...`);
    const initializeData: Buffer = Buffer.from('');
    const implementation = await this.getImplementation(packageName, contractName);
    return Proxy.deploy(implementation, proxyAdmin, initializeData, this.txParams);
  }

  private async _createProxyAndCall(contract: Contract, packageName: string, contractName: string, proxyAdmin: string, initMethodName: string, initArgs: any): Promise<Proxy> {
    const { method: initMethod, callData }: CalldataInfo = buildCallData(contract, initMethodName, initArgs);
    log.info(`Creating ${packageName} ${contractName} proxy and calling ${callDescription(initMethod, initArgs)}`);
    const implementation = await this.getImplementation(packageName, contractName);
    return Proxy.deploy(implementation, proxyAdmin, callData, this.txParams);
  }

  private async _copyContract(packageName: string, contractName: string, contract: Contract): Promise<Contract> {
    log.info(`Creating new non-upgradeable instance of ${packageName} ${contractName}...`);
    const implementation = await this.getImplementation(packageName, contractName);
    const instance = await copyContract(contract, implementation, { ...this.txParams });
    log.info(`${packageName} ${contractName} instance created at ${instance.address}`);
    return instance;
  }

  private async _initNonUpgradeableInstance(instance: Contract, contract: Contract, packageName: string, contractName: string, initMethodName: string, initArgs?: string[]): Promise<any> {
    if (typeof(initArgs) !== 'undefined') {
      // this could be front-run, waiting for new initializers model
      const { method: initMethod, callData }: CalldataInfo = buildCallData(contract, initMethodName, initArgs);
      log.info(`Initializing ${packageName} ${contractName} instance at ${instance.address} by calling ${callDescription(initMethod, initArgs)}`);
      await Transactions.sendDataTransaction(instance, Object.assign({}, { ...this.txParams }, { data: callData }));
    }
  }
}
