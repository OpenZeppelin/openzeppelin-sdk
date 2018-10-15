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
}
