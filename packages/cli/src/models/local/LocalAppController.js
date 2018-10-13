import LocalBaseController from './LocalBaseController';
import NetworkAppController from '../network/NetworkAppController';
import Dependency from '../dependency/Dependency';

export default class LocalAppController extends LocalBaseController {
  init(name, version, force = false, full = false) {
    super.init(name, version, force)
    if (full) this.packageFile.full = full
  }

  async linkLibs(libs, installLibs = false) {
    await Promise.all(libs.map(async libNameVersion => {
      const dependency = Dependency.fromNameWithVersion(libNameVersion)
      if (installLibs) await dependency.install()
      this.packageFile.setDependency(dependency.name, dependency.requirement)
    }))
  }

  unlinkLibs(libNames) {
    libNames
      .map(dep => Dependency.fromNameWithVersion(dep))
      .forEach(dep => this.packageFile.unsetDependency(dep.name))
  }

  onNetwork(network, txParams, networkFile = undefined) {
    return new NetworkAppController(this, network, txParams, networkFile);
  }
}
