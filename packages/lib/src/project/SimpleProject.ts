import isEmpty from 'lodash.isempty';

import Proxy from '../proxy/Proxy';
import Logger from '../utils/Logger';
import ZWeb3 from '../artifacts/ZWeb3';
import { deploy } from '../utils/Transactions';
import { toAddress } from '../utils/Addresses';
import ContractFactory, { ContractWrapper } from '../artifacts/ContractFactory';
import { ContractInterface } from './AppProject';
import BaseSimpleProject from './BaseSimpleProject';

const log: Logger = new Logger('SimpleProject');

export default class SimpleProject  extends BaseSimpleProject {
  constructor(name: string = 'main', txParams: any = {}) {
    super(name, txParams);
  }

  public async createProxy(contractClass, { packageName, contractName, initMethod: initMethodName, initArgs, redeployIfChanged }: ContractInterface = {}): Promise<ContractWrapper> {
    if (!isEmpty(initArgs) && !initMethodName) initMethodName = 'initialize';
    const implementationAddress = await this._getOrDeployImplementation(contractClass, packageName, contractName, redeployIfChanged);
    const initCallData = this._getAndLogInitCallData(contractClass, initMethodName, initArgs, implementationAddress, 'Creating');
    const proxyAdmin = await this.getAdminAddress();
    const proxy = await Proxy.deploy(implementationAddress, proxyAdmin, initCallData, this.txParams);
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

   public async getAdminAddress(): Promise<string> {
    return this.txParams.from || ZWeb3.defaultAccount();
  }
}
