import _ from 'lodash';
import { buildCallData, callDescription } from '../utils/ABIs';
import { deploy, sendDataTransaction } from "../utils/Transactions";
import Proxy from '../proxy/Proxy';
import Logger from '../utils/Logger';
import { toAddress } from '../utils/Addresses';

const log = new Logger('SimpleProject')

export default class SimpleProject  {
  constructor(name = 'main', txParams = {}) {
    this.txParams = txParams
    this.name = name
  }

  async createProxy(contractClass, { initMethod: initMethodName, initArgs } = {}) {
    if (!_.isEmpty(initArgs) && !initMethodName) initMethodName = 'initialize'

    const implementation = await this._deployImplementation(contractClass);
    let initCallData = "";

    if (initMethodName) {
      const { method: initMethod, callData } = buildCallData(contractClass, initMethodName, initArgs);
      log.info(`Creating proxy to logic contract ${implementation.address} and initializing by calling ${callDescription(initMethod, initArgs)}`)
      initCallData = callData;
    } else {
      log.info(`Creating proxy to logic contract ${implementation.address}`)  
    }
    
    const proxy = await Proxy.deploy(implementation, initCallData, this.txParams)
    log.info(`Instance created at ${proxy.address}`)
    return new contractClass(proxy.address);
  }

  async upgradeProxy(proxyAddress, contractClass, { initMethod, initArgs, initFrom } = {}) {
    proxyAddress = toAddress(proxyAddress)
    const implementation = await this._deployImplementation(contractClass);    
    log.info(`Upgrading proxy to new logic contract at ${implementation.address}`)
    const proxy = Proxy.at(proxyAddress, this.txParams)
    await proxy.upgradeTo(implementation)    
    await this._tryInitializeProxy(proxy, contractClass, initMethod, initArgs, initFrom)
    
    log.info(`Instance at ${proxyAddress} upgraded`)
    return new contractClass(proxyAddress);
  }

  async changeProxyAdmin(proxyAddress, newAdmin) {
    const proxy = Proxy.at(proxyAddress, this.txParams)
    await proxy.changeAdmin(newAdmin)
    log.info(`Proxy admin changed to ${newAdmin}`)
    return proxy
  }

  async _deployImplementation(contractClass) {
    log.info(`Deploying logic contract for ${contractClass.contractName}`);
    const implementation = await deploy(contractClass, [], this.txParams);
    return implementation;
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