'use strict';

import { LibProject } from 'zos-lib';
import NetworkBaseController from './NetworkBaseController';

export default class NetworkLibController extends NetworkBaseController {
  get isDeployed() {
    return !!this.packageAddress;
  }

  async createProxy() {
    throw Error('Cannot create proxy for library project')
  }

  async deploy() {
    try {
      this.project = await LibProject.deploy(this.currentVersion, this.txParams)
      this._registerPackage(await this.project.getProjectPackage())
      this._registerVersion(this.currentVersion, await this.project.getCurrentDirectory())
    } catch(deployError) {
      this._tryRegisterPartialDeploy(deployError)
    }
  }

  _tryRegisterPartialDeploy({ thepackage, directory }) {
    if (thepackage) this._registerPackage(thepackage)
    if (directory) this._registerVersion(this.currentVersion, directory)
  }

  async fetch() {
    if (!this.isDeployed) throw Error('Your application must be deployed to interact with it.');
    this.project = await LibProject.fetch(this.packageAddress, this.currentVersion, this.txParams);
  }

  async newVersion(versionName) {
    this.networkFile.frozen = false
    return super.newVersion(versionName)
  }

  async freeze() {
    await this.fetch()
    await this.project.freeze()
    this.networkFile.frozen = true
  }

  async uploadContracts(reupload) {
    if (this.networkFile.frozen) {
      throw Error('Cannot upload contracts for a frozen release. Run zos bump to create a new version first.');
    }
    await super.uploadContracts(reupload);
  }
}
