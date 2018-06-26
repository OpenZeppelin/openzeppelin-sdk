import Stdlib from '../stdlib/Stdlib';
import StdlibInstaller from '../stdlib/StdlibInstaller';
import LocalBaseController from './LocalBaseController';
import NetworkAppController from '../network/NetworkAppController';

export default class LocalAppController extends LocalBaseController {
  async linkStdlib(stdlibNameVersion, installLib = false) {
    if(stdlibNameVersion) {
      const stdlib = installLib
        ? await StdlibInstaller.call(stdlibNameVersion)
        : new Stdlib(stdlibNameVersion)

      const { name, version } = stdlib
      this.packageFile.stdlib = { name, version }
    }
  }

  onNetwork(network, txParams, networkFile = undefined) {
    return new NetworkAppController(this, network, txParams, networkFile);
  }
}
