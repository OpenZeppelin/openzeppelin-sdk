'use strict';

import NetworkBaseController from './NetworkBaseController';
import { LibProjectDeployer } from './ProjectDeployer';

export default class NetworkLibController extends NetworkBaseController {
  getDeployer(requestedVersion) {
    return new LibProjectDeployer(this, requestedVersion);
  }

  async createProxy() {
    throw Error('Cannot create proxy for library project')
  }

  _checkVersion() {
    if (this.packageVersion !== this.currentVersion) {
      this.networkFile.frozen = false
    }
    super._checkVersion()
  }

  async freeze() {
    await this.fetchOrDeploy(this.currentVersion)
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
