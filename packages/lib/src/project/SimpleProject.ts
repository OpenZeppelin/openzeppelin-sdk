import Proxy from '../proxy/Proxy';
import { Loggy } from '../utils/Logger';
import ZWeb3 from '../artifacts/ZWeb3';
import Contract from '../artifacts/Contract';
import { ContractInterface } from './AppProject';
import BaseSimpleProject from './BaseSimpleProject';
import ProxyFactory from '../proxy/ProxyFactory';
import { TxParams } from '../artifacts/ZWeb3';

export default class SimpleProject extends BaseSimpleProject {
  public constructor(name: string = 'main', proxyFactory?: ProxyFactory, txParams: TxParams = {}) {
    super(name, proxyFactory, txParams);
  }

  public async upgradeProxy(
    proxyAddress: string,
    contract: Contract,
    contractParams: ContractInterface = {},
  ): Promise<Contract> {
    const { implementationAddress, pAddress, initCallData } = await this._setUpgradeParams(
      proxyAddress,
      contract,
      contractParams,
    );
    Loggy.spin(__filename, 'upgradeProxy', `action-proxy-${pAddress}`, `Upgrading instance at ${pAddress}`);
    const proxy = Proxy.at(pAddress, this.txParams);
    await proxy.upgradeTo(implementationAddress, initCallData);
    Loggy.succeed(`action-proxy-${pAddress}`, `Instance at ${pAddress} upgraded`);
    return contract.at(proxyAddress);
  }

  public async changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<Proxy> {
    Loggy.spin(
      __filename,
      'changeProxyAdmin',
      `change-proxy-admin`,
      `Changing admin for proxy ${proxyAddress} to ${newAdmin}`,
    );
    const proxy: Proxy = Proxy.at(proxyAddress, this.txParams);
    await proxy.changeAdmin(newAdmin);
    Loggy.succeed('change-proxy-admin', `Admin for proxy ${proxyAddress} set to ${newAdmin}`);
    return proxy;
  }

  public async getAdminAddress(): Promise<string> {
    if (this.txParams.from) return new Promise(resolve => resolve(this.txParams.from));
    else return ZWeb3.defaultAccount();
  }
}
