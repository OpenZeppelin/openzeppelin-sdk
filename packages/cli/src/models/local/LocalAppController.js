import _ from 'lodash';
import Stdlib from '../stdlib/Stdlib';
import LocalBaseController from './LocalBaseController';
import StdlibInstaller from '../stdlib/StdlibInstaller';
import NetworkAppController from '../network/NetworkAppController';

export default class LocalAppController extends LocalBaseController {
  constructor(packageFileName, allowLib = false) {
    super(packageFileName);
    if (this.packageData.lib && !allowLib) {
      throw Error("Cannot create an application controller for a library");
    }
  }

  onNetwork(network, txParams, networkFileName) {
    return new NetworkAppController(this, network, txParams, networkFileName);
  }

  async linkStdlib(stdlibNameVersion, installLib = false) {
    if(stdlibNameVersion) {
      const stdlib = installLib
        ? await StdlibInstaller.call(stdlibNameVersion)
        : new Stdlib(stdlibNameVersion)

      this.packageData.stdlib = {
        name: stdlib.getName(),
        version: stdlib.getVersion()
      }
    }
  }

  hasStdlib() {
    return !_.isEmpty(this.packageData.stdlib);
  }

  isLib() {
    return false;
  }
}
