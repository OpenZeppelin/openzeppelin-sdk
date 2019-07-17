import { Loggy } from '../utils/Logger';
import ProxyAdmin from '../proxy/ProxyAdmin';
import BaseSimpleProject from './BaseSimpleProject';
import { ContractInterface } from './AppProject';
import Contract from '../artifacts/Contract';
import ProxyFactory from '../proxy/ProxyFactory';
import ProxyAdminProjectMixin from './mixin/ProxyAdminProjectMixin';
import { TxParams } from '../artifacts/ZWeb3';

class BaseProxyAdminProject extends BaseSimpleProject {
  public proxyAdmin: ProxyAdmin;

  public static async fetch(
    name: string = 'main',
    txParams: TxParams = {},
    proxyAdminAddress?: string,
    proxyFactoryAddress?: string,
  ): Promise<ProxyAdminProject> {
    const proxyAdmin = proxyAdminAddress ? await ProxyAdmin.fetch(proxyAdminAddress, txParams) : null;
    const proxyFactory = proxyFactoryAddress ? await ProxyFactory.fetch(proxyFactoryAddress, txParams) : null;
    return new ProxyAdminProject(name, proxyAdmin, proxyFactory, txParams);
  }

  public constructor(name: string = 'main', proxyAdmin: ProxyAdmin, proxyFactory?: ProxyFactory, txParams: any = {}) {
    super(name, proxyFactory, txParams);
    this.proxyAdmin = proxyAdmin;
  }

  public async createProxy(contract: Contract, contractParams: ContractInterface = {}): Promise<Contract> {
    if (!contractParams.admin) await this.ensureProxyAdmin();
    return super.createProxy(contract, contractParams);
  }

  public async createProxyWithSalt(
    contract: Contract,
    salt: string,
    signature?: string,
    contractParams: ContractInterface = {},
  ): Promise<Contract> {
    if (!contractParams.admin) await this.ensureProxyAdmin();
    return super.createProxyWithSalt(contract, salt, signature, contractParams);
  }

  public async upgradeProxy(
    proxyAddress: string,
    contract: Contract,
    contractParams: ContractInterface = {},
  ): Promise<Contract> {
    const { initMethod: initMethodName, initArgs } = contractParams;
    const { implementationAddress, pAddress, initCallData } = await this._setUpgradeParams(
      proxyAddress,
      contract,
      contractParams,
    );
    Loggy.spin(__filename, 'upgradeProxy', `action-proxy-${pAddress}`, `Upgrading instance at ${pAddress}`);
    await this.proxyAdmin.upgradeProxy(pAddress, implementationAddress, contract, initMethodName, initArgs);
    Loggy.succeed(`action-proxy-${pAddress}`, `Instance at ${pAddress} upgraded`);
    return contract.at(pAddress);
  }

  public getAdminAddress(): Promise<string> {
    return new Promise(resolve => resolve(this.proxyAdmin ? this.proxyAdmin.address : null));
  }

  public async ensureProxyAdmin(): Promise<ProxyAdmin> {
    if (!this.proxyAdmin) {
      this.proxyAdmin = await ProxyAdmin.deploy(this.txParams);
    }
    return this.proxyAdmin;
  }
}

// Mixings produce value but not type
// We have to export full class with type & callable
export default class ProxyAdminProject extends ProxyAdminProjectMixin(BaseProxyAdminProject) {}
