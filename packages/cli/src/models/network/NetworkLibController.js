import { Logger, Contracts, Package } from "zos-lib";
import NetworkBaseController from './NetworkBaseController';

export default class NetworkLibController extends NetworkBaseController {
  constructor(appController, network, txParams, networkFileName) {
    super(...arguments);
  }

  get defaultNetworkPackage() {
    return { contracts: {}, lib: true, frozen: false };
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
    this.networkPackage.frozen = false
    return this.package.newVersion(versionName);
  }

  async freeze() {
    await this.fetch()
    await this.package.freeze(this.networkPackage.version)
    this.networkPackage.frozen = true
  }

  async uploadContracts(reupload) {
    if (this.networkPackage.frozen) {
      throw Error("Cannot upload contract implementations for a frozen release. Run zos bump first to create a new version.");
    }
    await super.uploadContracts(reupload);
  }
}
