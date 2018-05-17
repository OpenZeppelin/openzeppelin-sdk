import { Logger, Contracts, FileSystem as fs, Package } from "zos-lib";
import NetworkBaseController from './NetworkBaseController';

const log = new Logger('NetworkLibController');

export default class NetworkLibController extends NetworkBaseController {
  constructor(appController, network, txParams, networkFileName) {
    super(...arguments);
  }

  get defaultNetworkPackage() {
    return { contracts: {}, lib: true };
  }

  isDeployed() {
    return !!this.packageAddress;
  }

  async deploy() {
    this.package = await Package.deploy(this.txParams);
    this.networkPackage.package = { address: this.package.address() };
  }

  async fetch() {
    const address = this.packageAddress;
    if (!address) throw Error('Your application must be deployed to interact with it.');
    this.package = await Package.fetch(address, this.txParams);
  }

  setImplementation(contractClass, contractAlias) {
    return this.package.setImplementation(this.networkPackage.version, contractClass, contractAlias);
  }

  newVersion(versionName) {
    return this.package.newVersion(versionName);
  }
}
