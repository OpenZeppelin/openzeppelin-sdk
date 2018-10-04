'use strict';

import NetworkBaseController from './NetworkBaseController';
import { LibProjectDeployer } from './ProjectDeployer';

export default class NetworkLibController extends NetworkBaseController {
  getDeployer() {
    return new LibProjectDeployer(this);
  }

  async createProxy() {
    throw Error('Cannot create proxy for library project')
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
