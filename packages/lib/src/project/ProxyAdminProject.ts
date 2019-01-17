import isEmpty from 'lodash.isempty';

import Proxy from '../proxy/Proxy';
import Logger from '../utils/Logger';
import ProxyAdmin from '../proxy/ProxyAdmin';
import BaseSimpleProject from './BaseSimpleProject';
import { ContractInterface } from './AppProject';
import ContractFactory, { ContractWrapper } from '../artifacts/ContractFactory';

const log: Logger = new Logger('ProxyAdminProject');

export default class ProxyAdminProject extends BaseSimpleProject {
  public proxyAdmin: ProxyAdmin;

  public static async fetchOrDeploy(name: string = 'main', txParams: any = {}, proxyAdminAddress?: string) {
    const proxyAdmin = proxyAdminAddress
      ? await ProxyAdmin.fetch(proxyAdminAddress)
      : await ProxyAdmin.deploy(txParams);

    return new this(name, proxyAdmin, txParams);
  }

  constructor(name, proxyAdmin, txParams) { 
    super(name, txParams);
    this.proxyAdmin = proxyAdmin;
  }

  public async createProxy(contractClass, { packageName, contractName, initMethod, initArgs, redeployIfChanged }: ContractInterface = {}): Promise<ContractWrapper> {
    if (!isEmpty(initArgs) && !initMethod) initMethod = 'initialize';
    const implementationAddress = await this._getOrDeployImplementation(contractClass, packageName, contractName, redeployIfChanged);
    const initCallData = this.getAndLogInitCallData(contractClass, initMethod, initArgs, implementationAddress, 'Creating');
    const proxy = await Proxy.deploy(implementationAddress, this.proxyAdmin.address, initCallData, this.txParams);
    log.info(`Instance created at ${proxy.address}`);
    return contractClass.at(proxy.address);
  }

  public async getAdminAddress(): Promise<string> {
    return '';
  }
}
