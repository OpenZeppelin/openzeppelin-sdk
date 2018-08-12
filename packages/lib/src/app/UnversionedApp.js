'use strict'

import BaseApp from "./BaseApp";
import { toAddress } from "../utils/Addresses";
import Contracts from "../utils/Contracts";
import { sendTransaction } from "../utils/Transactions";

export default class UnversionedApp extends BaseApp {

  static getContractClass() {
    return Contracts.getFromLib('UnversionedApp')
  }

  async setProvider(name, providerAddress) {
    return await sendTransaction(this.appContract.setProvider, [name, toAddress(providerAddress)], this.txParams)
  }

  async unsetProvider(name) {
    return await sendTransaction(this.appContract.unsetProvider, [name], this.txParams)
  }
}
