import isEmpty from 'lodash.isempty';

import Proxy from '../proxy/Proxy';
import Logger from '../utils/Logger';
import { deploy } from '../utils/Transactions';
import { toAddress } from '../utils/Addresses';
import { buildCallData, callDescription, CalldataInfo } from '../utils/ABIs';
import ContractFactory, { ContractWrapper } from '../artifacts/ContractFactory';
import { ContractInterface } from './AppProject';
import BaseSimpleProject from './BaseSimpleProject';

interface Implementations {
  [contractName: string]: Implementation;
}

interface Implementation {
  address: string;
  bytecodeHash: string;
}

interface Dependencies {
  [packageName: string]: Dependency;
}

interface Dependency {
  package: string;
  version: string;
}

const log: Logger = new Logger('SimpleProject');

export default class SimpleProject  extends BaseSimpleProject {

  constructor(name: string = 'main', txParams: any = {}) {
    super(name, txParams);
  }

  public async createProxy(contractClass, { packageName, contractName, initMethod: initMethodName, initArgs, redeployIfChanged }: ContractInterface = {}): Promise<ContractWrapper> {
    if (!isEmpty(initArgs) && !initMethodName) initMethodName = 'initialize';
    const implementationAddress = await this._getOrDeployImplementation(contractClass, packageName, contractName, redeployIfChanged);
    const initCallData = this.getAndLogInitCallData(contractClass, initMethodName, initArgs, implementationAddress, 'Creating');
    const proxyAdmin = await this.getAdminAddress();
    const proxy = await Proxy.deploy(implementationAddress, proxyAdmin, initCallData, this.txParams);
    log.info(`Instance created at ${proxy.address}`);
    return contractClass.at(proxy.address);
  }

  public async upgradeProxy(proxyAddress: string, contractClass: ContractFactory, { packageName, contractName, initMethod: initMethodName, initArgs, redeployIfChanged }: ContractInterface = {}): Promise<ContractWrapper> {
    proxyAddress = toAddress(proxyAddress);
    const implementationAddress = await this._getOrDeployImplementation(contractClass, packageName, contractName, redeployIfChanged);
    const initCallData = this.getAndLogInitCallData(contractClass, initMethodName, initArgs, implementationAddress, 'Upgrading');
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
}
