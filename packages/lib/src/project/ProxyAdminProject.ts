import Proxy from '../proxy/Proxy';
import Logger from '../utils/Logger';
import ProxyAdmin from '../proxy/ProxyAdmin';
import BaseSimpleProject from './BaseSimpleProject';
import { ContractInterface } from './AppProject';
import Contract from '../artifacts/Contract';

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

  public async createProxy(contract: Contract, contractParams: ContractInterface = {}): Promise<Contract> {
    if(!this.proxyAdmin) this.proxyAdmin = await ProxyAdmin.deploy(this.txParams);
    return super.createProxy(contract, contractParams);
  }

  public async upgradeProxy(proxyAddress: string, contract: Contract, contractParams: ContractInterface = {}): Promise<Contract> {
    const { initMethod: initMethodName, initArgs } = contractParams;
    const { implementationAddress, pAddress, initCallData } = await this._setUpgradeParams(proxyAddress, contract, contractParams);
    await this.proxyAdmin.upgradeProxy(pAddress, implementationAddress, contract, initMethodName, initArgs);
    log.info(`Instance at ${pAddress} upgraded`);
    return contract.at(pAddress);
  }

  public async changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void> {
    await this.proxyAdmin.changeProxyAdmin(proxyAddress, newAdmin);
    log.info(`Proxy ${proxyAddress} admin changed to ${newAdmin}`);
  }

  public getAdminAddress(): Promise<string> {
    return new Promise((resolve) => resolve(this.proxyAdmin.address));
  }
}
