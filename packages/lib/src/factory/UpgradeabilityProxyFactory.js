'use strict'

import Logger from '../utils/Logger'
import Contracts from '../utils/Contracts'
import { deploy as deployContract } from '../utils/Transactions';

const log = new Logger('UpgradeabilityProxyFactory')

export default class UpgradeabilityProxyFactory {

  static async deploy(txParams = {}) {
    log.info('Deploying new UpgradeabilityProxyFactory...')
    const factoryContract = await deployContract(Contracts.getFromLib('UpgradeabilityProxyFactory'), [], txParams)
    log.info(`Deployed UpgradeabilityProxyFactory ${factoryContract.address}`)
    return new this(factoryContract, txParams)
  }

  static async fetch(address, txParams = {}) {
    const factoryContract = await Contracts.getFromLib('UpgradeabilityProxyFactory').at(address);
    return new this(factoryContract, txParams);
  }

  constructor(factoryContract, txParams = {}) {
    this.factoryContract = factoryContract;
    this.txParams = txParams;
  }

  get address() {
    return this.factoryContract.address;
  }

  get contract() {
    return this.factoryContract;
  }
}