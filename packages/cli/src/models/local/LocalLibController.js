import LocalBaseController from './LocalBaseController';
import NetworkLibController from '../network/NetworkLibController';

export default class LocalLibController extends LocalBaseController {
  init(name, version, force = false) {
    super.init(name, version, force);
    this.packageFile.lib = true;
  }

  onNetwork(network, txParams, networkFile = undefined) {
    return new NetworkLibController(this, network, txParams, networkFile);
  }
}
