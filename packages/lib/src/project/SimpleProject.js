import _ from 'lodash';
import { buildCallData, callDescription } from '../utils/ABIs';
import { deploy, sendDataTransaction } from "../utils/Transactions";
import Proxy from '../proxy/Proxy';
import Logger from '../utils/Logger';
import { toAddress } from '../utils/Addresses';
import { bytecodeDigest } from '..';

const log = new Logger('SimpleProject')

export default class SimpleProject  {
  constructor(name = 'main', txParams = {}) {
    this.txParams = txParams
    this.name = name
    this.implementations = {}
  }

  async createProxy(contractClass, { contractName, initMethod: initMethodName, initArgs, redeployIfChanged } = {}) {
    if (!_.isEmpty(initArgs) && !initMethodName) initMethodName = 'initialize'
    const implementation = await this._getOrDeployImplementation(contractClass, contractName, redeployIfChanged);
    const initCallData = this._getAndLogInitCallData(contractClass, initMethodName, initArgs, implementation.address, 'Creating')
    const proxy = await Proxy.deploy(implementation, initCallData, this.txParams)
    log.info(`Instance created at ${proxy.address}`)
    return new contractClass(proxy.address);
  }

  async upgradeProxy(proxyAddress, contractClass, { contractName, initMethod: initMethodName, initArgs, redeployIfChanged } = {}) {
    proxyAddress = toAddress(proxyAddress)
    const implementation = await this._getOrDeployImplementation(contractClass, contractName, redeployIfChanged);    
    const initCallData = this._getAndLogInitCallData(contractClass, initMethodName, initArgs, implementation.address, 'Upgrading')
    const proxy = Proxy.at(proxyAddress, this.txParams)
    await proxy.upgradeTo(implementation, initCallData)
    log.info(`Instance at ${proxyAddress} upgraded`)
    return new contractClass(proxyAddress);
  }

  async changeProxyAdmin(proxyAddress, newAdmin) {
    const proxy = Proxy.at(proxyAddress, this.txParams)
    await proxy.changeAdmin(newAdmin)
    log.info(`Proxy admin changed to ${newAdmin}`)
    return proxy
  }

  async setImplementation(contractClass, contractName) {
    log.info(`Deploying logic contract for ${contractClass.contractName}`);
    if (!contractName) contractName = contractClass.contractName;
    const implementation = await deploy(contractClass, [], this.txParams);
    this.registerImplementation(contractName, {
      address: implementation.address,
      bytecodeHash: bytecodeDigest(contractClass.bytecode)
    })
    return implementation;
  }

  async unsetImplementation(contractName) {
    delete this.implementations[contractName]
  }

  registerImplementation(contractName, { address, bytecodeHash }) {
    this.implementations[contractName] = { address, bytecodeHash }
  }

  async _getOrDeployImplementation(contractClass, contractName, redeployIfChanged) {
    if (!contractName) contractName = contractClass.contractName;
    const existing = this.implementations[contractName];
    if (existing && (!redeployIfChanged || existing.bytecodeHash === bytecodeDigest(contractClass.bytecode))) {
      return existing
    } else {
      return this.setImplementation(contractClass, contractName);
    }
  }

  _getAndLogInitCallData(contractClass, initMethodName, initArgs, implementationAddress, actionLabel) {
    if (initMethodName) {
      const { method: initMethod, callData } = buildCallData(contractClass, initMethodName, initArgs);
      log.info(`${actionLabel} proxy to logic contract ${implementationAddress} and initializing by calling ${callDescription(initMethod, initArgs)}`)
      return callData;
    } else {
      log.info(`${actionLabel} proxy to logic contract ${implementationAddress}`)  
      return null;
    }
  }

  async _tryInitializeProxy(proxy, contractClass, initMethodName, initArgs, initFrom) {
    if (!initMethodName) return;
    
    if (!initFrom) {
      throw Error(`Initialization sender address is required`)
    } else if (initFrom === this.txParams.from) {
      throw Error(`Cannot initialize the proxy from the same address as its admin address. Make sure you use a different 'initFrom' account when calling upgrade.`)
    }
    
    const { method: initMethod, callData } = buildCallData(contractClass, initMethodName, initArgs);
    log.info(`Initializing proxy at ${proxy.address} by calling ${callDescription(initMethod, initArgs)}`);
    await sendDataTransaction(proxy.contract, Object.assign({}, this.txParamsInitializer, { data: callData }))
  }
}