import _ from 'lodash';
import Stdlib from '../stdlib/Stdlib';
import { Logger, Contracts, FileSystem as fs, App } from "zos-lib";
import NetworkBaseController from './NetworkBaseController';

const log = new Logger('NetworkAppController');

export default class NetworkAppController extends NetworkBaseController {
  constructor(appController, network, txParams, networkFileName) {
    super(...arguments);
  }

  get appAddress() {
    return this.networkPackage.app && this.networkPackage.app.address;
  }

  get defaultNetworkPackage() {
    return { contracts: {}, proxies: {} };
  }

  isDeployed() {
    return !!this.appAddress;
  }

  async deploy() {
    this.app = await App.deploy(this.packageData.version, 0x0, this.txParams);
    this.networkPackage.app = { address: this.app.address() };
    this.networkPackage.version = this.packageData.version;
    this.networkPackage.package = { address: this.app.package.address };
    this.networkPackage.provider = { address: this.app.currentDirectory().address };
  }

  async fetch() {
    const address = this.appAddress;
    if (!address) throw Error('Your application must be deployed to interact with it.');
    this.app = await App.fetch(address, this.txParams);
  }

  async push(reupload = false) {
    await super.push(reupload);
    await this.linkStdlib()
  }

  async deployStdlib() {
    if (!this.localController.hasStdlib()) {
      delete this.networkPackage['stdlib'];
      return;
    }
    const stdlibAddress = await Stdlib.deploy(this.packageData.stdlib.name, this.txParams);
    this.networkPackage.stdlib = { address: stdlibAddress, customDeploy: true, ... this.packageData.stdlib };
  }

  async newVersion(versionName) {
    // REFACTOR: App should return the newly created directory upon newVersion
    await this.app.newVersion(versionName);
    return this.app.currentDirectory();
  }

  setImplementation(contractClass, contractAlias) {
    return this.app.setImplementation(contractClass, contractAlias);
  }

  async createProxy(contractAlias, initMethod, initArgs) {
    await this.fetch();
    const contractClass = this.localController.getContractClass(contractAlias);
    const proxyInstance = await this.app.createProxy(contractClass, contractAlias, initMethod, initArgs);
    
    const proxyInfo = {
      address: proxyInstance.address,
      version: this.app.version
    };

    const proxies = this.networkPackage.proxies;
    if (!proxies[contractAlias]) proxies[contractAlias] = [];
    proxies[contractAlias].push(proxyInfo);
    return proxyInstance;
  }

  async upgradeProxies(contractAlias, proxyAddress, initMethod, initArgs) {
    const proxyInfos = this.getProxies(contractAlias, proxyAddress);
    if (_.isEmpty(proxyInfos)) {
      log.info("No proxies to upgrade were found");
      return;
    }

    await this.fetch();
    const newVersion = this.app.version;
    
    await Promise.all(_.flatMap(proxyInfos, (contractProxyInfos, contractAlias) => {
      const contractClass = this.localController.getContractClass(contractAlias);
      return _.map(contractProxyInfos, async (proxyInfo) => {        
        await this.app.upgradeProxy(proxyInfo.address, contractClass, contractAlias, initMethod, initArgs);
        proxyInfo.version = newVersion;
      });
    }));

    return proxyInfos;
  }

  /**
   * Returns all proxies, optionally filtered by a contract alias and a proxy address
   * @param {*} contractAlias 
   * @param {*} proxyAddress 
   * @returns an object with contract aliases as keys, and arrays of Proxy (address, version) as values
   */
  getProxies(contractAlias, proxyAddress) {
    if (!contractAlias) {
      if (proxyAddress) throw Error('Must set contract alias if filtering by proxy address.');
      return this.networkPackage.proxies;
    }

    return { 
      [contractAlias]: _.filter(this.networkPackage.proxies[contractAlias], proxy => (
        !proxyAddress || proxy.address === proxyAddress
      ))
    };
  }

  async linkStdlib() {
    if (!this.localController.hasStdlib()) {
      await this.app.setStdlib();
      delete this.networkPackage['stdlib'];
      return;
    }

    const networkStdlib = this.networkPackage.stdlib;
    const hasNetworkStdlib = !_.isEmpty(networkStdlib);
    const hasCustomDeploy = hasNetworkStdlib && networkStdlib.customDeploy;
    const customDeployMatches = hasCustomDeploy && this.areSameStdlib(networkStdlib, this.packageData.stdlib);

    if (customDeployMatches) {
      log.info(`Using existing custom deployment of stdlib at ${networkStdlib.address}`);
      await this.app.setStdlib(networkStdlib.address);
      return;
    }

    // TODO: Check that package version matches the requested one
    // TODO: Do not invoke setStdlib if matches existing one
    log.info(`Connecting to public deployment of ${this.packageData.stdlib.name} in ${this.network}`);
    const stdlibAddress = Stdlib.fetch(this.packageData.stdlib.name, this.network);
    await this.app.setStdlib(stdlibAddress);
    this.networkPackage.stdlib = { address: stdlibAddress, ... this.packageData.stdlib };
  }

  areSameStdlib(aStdlib, anotherStdlib) {
    return aStdlib.name === anotherStdlib.name && aStdlib.version === anotherStdlib.version
  }

  isStdlibContract(contractAlias) {
    if (!this.localController.hasStdlib()) return false;
    const stdlib = new Stdlib(this.packageData.stdlib.name);
    return stdlib.hasContract(contractAlias);
  }

  isContractDefined(contractAlias) {
    return super.isContractDefined(contractAlias) || this.isStdlibContract(contractAlias);
  }

}
