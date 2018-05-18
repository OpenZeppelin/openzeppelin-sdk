import LocalBaseController from './LocalBaseController';
import NetworkLibController from '../network/NetworkLibController';

export default class LocalLibController extends LocalBaseController {
  constructor(packageFileName) {
    super(packageFileName);
  }

  onNetwork(network, txParams, networkFileName) {
    return new NetworkLibController(this, network, txParams, networkFileName);
  }

  init(name, version, force = false) {
    super.init(name, version, force);
    this.packageData.lib = true;
  }

  isLib() {
    return true;
  }
}
