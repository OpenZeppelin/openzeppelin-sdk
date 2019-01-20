import isEmpty from 'lodash.isempty';

import Proxy from '../proxy/Proxy';
import Logger from '../utils/Logger';
import ProxyAdmin from '../proxy/ProxyAdmin';
import BaseSimpleProject from './BaseSimpleProject';
import { toAddress } from '../utils/Addresses';
import { ContractInterface } from './AppProject';
import ContractFactory, { ContractWrapper } from '../artifacts/ContractFactory';

const log: Logger = new Logger('ProxyAdminProject');

export default class ProxyAdminProject extends BaseSimpleProject {
  public proxyAdmin: ProxyAdmin;

  public static async fetch(name: string = 'main', txParams: any = {}, proxyAdminAddress?: string) {
    const proxyAdmin = proxyAdminAddress ? await ProxyAdmin.fetch(proxyAdminAddress, txParams) : null;
    return new this(name, proxyAdmin, txParams);
  }

  constructor(name, proxyAdmin, txParams) { 
    super(name, txParams);
    this.proxyAdmin = proxyAdmin;
  }

  public async createProxy(contractClass, { packageName, contractName, initMethod, initArgs, redeployIfChanged }: ContractInterface = {}): Promise<ContractWrapper> {
    if(!this.proxyAdmin) this.proxyAdmin = await ProxyAdmin.deploy(this.txParams)
    if (!isEmpty(initArgs) && !initMethod) initMethod = 'initialize';
    const implementationAddress = await this._getOrDeployImplementation(contractClass, packageName, contractName, redeployIfChanged);
    const initCallData = this._getAndLogInitCallData(contractClass, initMethod, initArgs, implementationAddress, 'Creating');
    const proxy = await Proxy.deploy(implementationAddress, await this.getAdminAddress(), initCallData, this.txParams);
    log.info(`Instance created at ${proxy.address}`);
    return contractClass.at(proxy.address);
  }

  public async upgradeProxy(proxyAddress: string, contractClass: ContractFactory, { packageName, contractName, initMethod: initMethodName, initArgs, redeployIfChanged }: ContractInterface = {}): Promise<ContractWrapper> {
    proxyAddress = toAddress(proxyAddress);
    const implementationAddress = await this._getOrDeployImplementation(contractClass, packageName, contractName, redeployIfChanged);
    const initCallData = this._getAndLogInitCallData(contractClass, initMethodName, initArgs, implementationAddress, 'Upgrading');
    await this.proxyAdmin.upgradeProxy(proxyAddress, implementationAddress, contractClass, initMethodName, initArgs);
    log.info(`Instance at ${proxyAddress} upgraded`);
    return contractClass.at(proxyAddress);
  }

  public async changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void> {
    await this.proxyAdmin.changeProxyAdmin(proxyAddress, newAdmin);
    log.info(`Proxy ${proxyAddress} admin changed to ${newAdmin}`);
  }

  public getAdminAddress(): Promise<string> {
    return this.proxyAdmin.address;
  }
}
