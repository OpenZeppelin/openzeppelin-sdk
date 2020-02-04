import { isEmpty } from 'lodash';

import { Loggy } from '../utils/Logger';
import Contracts from '../artifacts/Contracts';
import { toAddress } from '../utils/Addresses';
import { buildCallData, callDescription, CalldataInfo } from '../utils/ABIs';
import Transactions from '../utils/Transactions';
import Contract from '../artifacts/Contract';
import { TxParams } from '../artifacts/ZWeb3';

export default class ProxyAdmin {
  public contract: Contract;
  public address: string;
  public txParams: TxParams;

  public static fetch(address: string, txParams: TxParams = {}): ProxyAdmin {
    const contract = Contracts.getFromLib('ProxyAdmin').at(address);
    return new this(contract, txParams);
  }

  public static async deploy(txParams: TxParams = {}): Promise<ProxyAdmin> {
    Loggy.spin(__filename, 'deploy', `deploy-proxy-admin`, 'Setting everything up to create contract instances');
    const contract = await Transactions.deployContract(Contracts.getFromLib('ProxyAdmin'), [], txParams);
    Loggy.succeed(`deploy-proxy-admin`);
    return new this(contract, txParams);
  }

  public constructor(contract: any, txParams: TxParams = {}) {
    this.contract = contract;
    this.address = toAddress(contract);
    this.txParams = txParams;
  }

  public async getProxyImplementation(proxyAddress: string): Promise<string> {
    return this.contract.methods.getProxyImplementation(proxyAddress).call({ ...this.txParams });
  }

  public async changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void> {
    Loggy.spin(
      __filename,
      'changeProxyAdmin',
      `change-proxy-admin`,
      `Changing admin for proxy ${proxyAddress} to ${newAdmin}`,
    );
    await Transactions.sendTransaction(this.contract.methods.changeProxyAdmin, [proxyAddress, newAdmin], {
      ...this.txParams,
    });
    Loggy.succeed('change-proxy-admin', `Admin for proxy ${proxyAddress} set to ${newAdmin}`);
  }

  public async upgradeProxy(
    proxyAddress: string,
    implementationAddress: string,
    contract: Contract,
    initMethodName: string,
    initArgs: any,
  ): Promise<Contract> {
    if (!isEmpty(initArgs) && !initMethodName) initMethodName = 'initialize';
    const receipt: any =
      initMethodName === undefined
        ? await this._upgradeProxy(proxyAddress, implementationAddress)
        : await this._upgradeProxyAndCall(proxyAddress, implementationAddress, contract, initMethodName, initArgs);
    Loggy.succeed(
      `upgrade-proxy-${proxyAddress}`,
      `Instance upgraded at ${proxyAddress}. Transaction receipt: ${receipt.transactionHash}`,
    );
    return contract.at(proxyAddress);
  }

  public async transferOwnership(newAdminOwner: string): Promise<void> {
    await this.checkOwner();
    Loggy.spin(
      __filename,
      'transferOwnerShip',
      'transfer-ownership',
      `Changing ownership of proxy admin to ${newAdminOwner}`,
    );
    await Transactions.sendTransaction(this.contract.methods.transferOwnership, [newAdminOwner], { ...this.txParams });
    Loggy.succeed('transfer-ownership', `Proxy admin owner set to ${newAdminOwner}`);
  }

  public async getOwner(): Promise<string> {
    return await this.contract.methods.owner().call({ ...this.txParams });
  }

  private async checkOwner(): Promise<void | never> {
    const currentOwner: string = await this.getOwner();
    const { from } = this.txParams;
    if (from && currentOwner !== from) {
      throw new Error(
        `Cannot change ownership from non-owner account: current owner is ${currentOwner} and sender is ${from}`,
      );
    }
  }

  private async _upgradeProxy(proxyAddress: string, implementation: string): Promise<any> {
    Loggy.spin(__filename, '_upgradeProxy', `upgrade-proxy-${proxyAddress}`, `Upgrading instance at ${proxyAddress}`);
    return Transactions.sendTransaction(this.contract.methods.upgrade, [proxyAddress, implementation], {
      ...this.txParams,
    });
  }

  private async _upgradeProxyAndCall(
    proxyAddress: string,
    implementationAddress: string,
    contract: any,
    initMethodName: string,
    initArgs: any,
  ): Promise<any> {
    const { method: initMethod, callData }: CalldataInfo = buildCallData(contract, initMethodName, initArgs);
    Loggy.spin(
      __filename,
      '_upgradeProxyAndCall',
      `upgrade-proxy-${proxyAddress}`,
      `Upgrading instance at ${proxyAddress} and calling ${callDescription(initMethod, initArgs)}`,
    );
    return Transactions.sendTransaction(
      this.contract.methods.upgradeAndCall,
      [proxyAddress, implementationAddress, callData],
      { ...this.txParams },
    );
  }
}
