'use strict';

import { Logger, Contracts, Package } from 'zos-lib';
import NetworkBaseController from './NetworkBaseController';

export default class NetworkLibController extends NetworkBaseController {
  get isDeployed() {
    return !!this.packageAddress;
  }

  async createProxy() {
    throw Error('Cannot create proxy for stdlib')
  }

  async deploy() {
    this.package = await Package.deploy(this.txParams);
    this.networkFile.package = { address: this.package.address() }
  }

  async fetch() {
    if (!this.isDeployed) throw Error('Your application must be deployed to interact with it.');
    this.package = await Package.fetch(this.packageAddress, this.txParams);
  }

  async setImplementation(contractClass, contractAlias) {
    return this.package.setImplementation(this.networkFile.version, contractClass, contractAlias);
  }

  newVersion(versionName) {
    this.networkFile.frozen = false
    return this.package.newVersion(versionName)
  }

  async freeze() {
    await this.fetch()
    await this.package.freeze(this.networkFile.version)
    this.networkFile.frozen = true
  }

  async uploadContracts(reupload) {
    if (this.networkFile.frozen) {
      throw Error('Cannot upload contracts for a frozen release. Run zos bump to create a new version first.');
    }
    await super.uploadContracts(reupload);
  }
}
