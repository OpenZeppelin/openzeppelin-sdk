'use strict'

import BaseApp from "./BaseApp";
import Package from "../package/Package";
import { toAddress, isZeroAddress } from "../utils/Addresses";
import Contracts from "../utils/Contracts";
import { sendTransaction } from "../utils/Transactions";

export default class VersionedApp extends BaseApp {

  static getContractClass() {
    return Contracts.getFromLib('VersionedApp')
  }

  async getPackage(name) {
    const [address, version] = await this.appContract.getPackage(name)
    const thepackage = await Package.fetch(address, this.txParams)
    return { package: thepackage, version }
  }

  async hasPackage(name) {
    const [address, _version] = await this.appContract.getPackage(name)
    return !isZeroAddress(address)
  }

  async setPackage(name, packageAddress, version) {
    return await sendTransaction(this.appContract.setPackage, [name, toAddress(packageAddress), version], this.txParams)
  }

  async unsetPackage(name) {
    return await sendTransaction(this.appContract.unsetPackage, [name], this.txParams)
  }
}
