'use strict';

import { LibProject } from 'zos-lib';
import NetworkBaseController from './NetworkBaseController';

export default class NetworkLibController extends NetworkBaseController {
  async createProxy() {
    throw Error('Cannot create proxy for library project')
  }

  async fetchOrDeploy() {
    try {
      const { packageAddress } = this

      this.project = await LibProject.fetchOrDeploy(this.currentVersion, this.txParams, { packageAddress })
      this._registerPackage(await this.project.getProjectPackage())
      this._registerVersion(this.currentVersion, await this.project.getCurrentDirectory())
    } catch(deployError) {
      this._tryRegisterPartialDeploy(deployError)
    }
  }

  _registerVersion(version, { address }) {
    super._registerVersion(version, { address })
  }

  _checkVersion() {
    const requestedVersion = this.packageFile.version
    const currentVersion = this.networkFile.version

    if (requestedVersion !== currentVersion) {
      this.networkFile.frozen = false
    }
    super._checkVersion()
  }
  async freeze() {
    await this.fetchOrDeploy()
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
