import { isEmpty } from 'lodash';

import { Loggy } from '../utils/Logger';
import Proxy from '../proxy/Proxy';
import Contracts from '../artifacts/Contracts';
import Package from '../application/Package';
import ImplementationDirectory from '../application/ImplementationDirectory';
import { isZeroAddress, toAddress } from '../utils/Addresses';
import { buildCallData, callDescription, CalldataInfo } from '../utils/ABIs';
import Contract from '../artifacts/Contract';
import { toSemanticVersion, semanticVersionEqual } from '../utils/Semver';
import Transactions from '../utils/Transactions';
import { TxParams } from '../artifacts/ZWeb3';

export default class App {
  public appContract: any;
  private txParams: TxParams;

  public static async fetch(address: string, txParams: TxParams = {}): Promise<App> {
    const appContract = (await this.getContractClass()).at(address);
    return new this(appContract, txParams);
  }

  public static async deploy(txParams: TxParams = {}): Promise<App> {
    const appContract = await Transactions.deployContract(this.getContractClass(), [], txParams);
    Loggy.onVerbose(__filename, 'deploy', `deployed-app`, `Deployed App at ${appContract.address}`);
    return new this(appContract, txParams);
  }

  public static getContractClass(): Contract {
    return Contracts.getFromLib('App');
  }

  public constructor(appContract: Contract, txParams: TxParams = {}) {
    this.appContract = appContract;
    this.txParams = txParams;
  }

  public async getPackage(name): Promise<{ package: Package; version: string }> {
    const { ['0']: address, ['1']: version } = await this.appContract.methods.getPackage(name).call();
    const thepackage = Package.fetch(address, { ...this.txParams });
    return { package: thepackage, version };
  }

  public async hasPackage(name: string, expectedVersion?: string): Promise<boolean> {
    const { ['0']: address, ['1']: version } = await this.appContract.methods.getPackage(name).call();
    return !isZeroAddress(address) && (!expectedVersion || semanticVersionEqual(expectedVersion, version));
  }

  public async setPackage(name: string, packageAddress: string, version: string): Promise<any> {
    return await Transactions.sendTransaction(
      this.appContract.methods.setPackage,
      [name, toAddress(packageAddress), toSemanticVersion(version)],
      { ...this.txParams },
    );
  }

  public async unsetPackage(name: string): Promise<any> {
    return await Transactions.sendTransaction(this.appContract.methods.unsetPackage, [name], { ...this.txParams });
  }

  public get address(): string {
    return this.appContract.address;
  }

  public get contract(): Contract {
    return this.appContract;
  }

  public async getImplementation(packageName: string, contractName: string): Promise<string> {
    return this.appContract.methods.getImplementation(packageName, contractName).call();
  }

  public async hasProvider(name: string): Promise<boolean> {
    return (await this.getProvider(name)) != null;
  }

  public async getProvider(name: string): Promise<ImplementationDirectory> {
    const address = await this.appContract.methods.getProvider(name).call();
    if (isZeroAddress(address)) return null;
    return ImplementationDirectory.fetch(address, { ...this.txParams });
  }

  public async createProxy(
    contract: Contract,
    packageName: string,
    contractName: string,
    proxyAdmin: string,
    initMethodName: string,
    initArgs?: string[],
  ): Promise<Contract> {
    if (!isEmpty(initArgs) && !initMethodName) initMethodName = 'initialize';
    const implementation = await this.getImplementation(packageName, contractName);
    const proxy =
      initMethodName === undefined
        ? await this._createProxy(packageName, contractName, implementation, proxyAdmin)
        : await this._createProxyAndCall(
            contract,
            packageName,
            contractName,
            implementation,
            proxyAdmin,
            initMethodName,
            initArgs,
          );
    Loggy.succeed(`create-proxy`, `${packageName} ${contractName} instance created at ${proxy.address}`);
    return contract.at(proxy.address);
  }

  private async _createProxy(
    packageName: string,
    contractName: string,
    implementation: string,
    proxyAdmin: string,
  ): Promise<Proxy> {
    const initializeData: Buffer = Buffer.from('');
    Loggy.spin(__filename, '_createProxy', `create-proxy`, `Creating ${packageName} ${contractName} proxy`);
    return Proxy.deploy(implementation, proxyAdmin, initializeData, this.txParams);
  }

  private async _createProxyAndCall(
    contract: Contract,
    packageName: string,
    contractName: string,
    implementation: string,
    proxyAdmin: string,
    initMethodName: string,
    initArgs: any,
  ): Promise<Proxy> {
    const { method: initMethod, callData }: CalldataInfo = buildCallData(contract, initMethodName, initArgs);
    Loggy.spin(
      __filename,
      '_createProxyAndCall',
      `create-proxy`,
      `Creating ${packageName}/${contractName} instance and calling ${callDescription(initMethod, initArgs)}`,
    );
    return Proxy.deploy(implementation, proxyAdmin, callData, this.txParams);
  }
}
