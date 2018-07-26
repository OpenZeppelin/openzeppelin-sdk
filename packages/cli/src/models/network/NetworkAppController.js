import _ from 'lodash';
import Stdlib from '../stdlib/Stdlib';
import NetworkBaseController from './NetworkBaseController';
import { Contracts, Logger, App, FileSystem as fs } from 'zos-lib';

const log = new Logger('NetworkAppController');

export default class NetworkAppController extends NetworkBaseController {
  get isDeployed() {
    return !!this.appAddress;
  }

  get appAddress() {
    return this.networkFile.appAddress
  }

  async deploy() {
    this.app = await App.deploy(this.packageFile.version, this.txParams);
    this.networkFile.app = { address: this.app.address() };
    this.networkFile.version = this.app.version;
    this.networkFile.package = { address: this.app.package.address };
    this.networkFile.provider = { address: this.app.currentDirectory().address };
  }

  async fetch() {
    if (!this.isDeployed) throw Error('Your application must be deployed to interact with it.');
    this.app = await App.fetch(this.appAddress, this.txParams);
  }

  async push(reupload = false) {
    await super.push(reupload);
    await this.linkStdlib()
  }

  async deployStdlib() {
    if (!this.packageFile.hasStdlib()) return this.networkFile.unsetStdlib()
    const stdlibAddress = await Stdlib.deploy(this.packageFile.stdlibName, this.txParams);
    this.networkFile.stdlib = { address: stdlibAddress, customDeploy: true, ... this.packageFile.stdlib };
  }

  async newVersion(versionName) {
    // REFACTOR: App should return the newly created directory upon newVersion
    await this.app.newVersion(versionName);
    return this.app.currentDirectory();
  }

  async setImplementation(contractClass, contractAlias) {
    return this.app.setImplementation(contractClass, contractAlias);
  }

  async unsetImplementation(contractAlias) {
    return this.app.unsetImplementation(contractAlias);
  }

  async createProxy(contractAlias, initMethod, initArgs) {
    await this.fetch();
    const contractClass = this.localController.getContractClass(contractAlias);
    this.checkInitialization(contractClass, initMethod, initArgs);
    const proxyInstance = await this.app.createProxy(contractClass, contractAlias, initMethod, initArgs);
    const implementationAddress = await this.app.getImplementation(contractAlias);
    this._updateTruffleDeployedInformation(contractAlias, proxyInstance)

    this.networkFile.addProxy(contractAlias, {
      address: proxyInstance.address,
      version: this.app.version,
      implementation: implementationAddress
    })
    return proxyInstance;
  }

  checkInitialization(contractClass, calledInitMethod, calledInitArgs) {
    // If there is an initializer called, assume it's ok
    if (calledInitMethod) return;

    // Otherwise, warn the user to invoke it
    const initializeMethod = contractClass.abi.find(fn => fn.type === 'function' && fn.name === 'initialize');
    if (!initializeMethod) return;
    log.error(`Possible initialization method 'initialize' found in contract. Make sure you initialize your instance.`);
  }

  async upgradeProxies(contractAlias, proxyAddress, initMethod, initArgs) {
    const proxyInfos = this.getProxies(contractAlias, proxyAddress);
    if (_.isEmpty(proxyInfos) || (contractAlias && _.isEmpty(proxyInfos[contractAlias]))) {
      log.info('No proxies to update were found');
      return;
    }

    await this.fetch();
    const newVersion = this.app.version;
    const failures = []
    await Promise.all(_.flatMap(proxyInfos, (contractProxyInfos, contractAlias) => {
      const contractClass = this.localController.getContractClass(contractAlias);
      this.checkUpgrade(contractClass, initMethod, initArgs);
      return _.map(contractProxyInfos, async (proxyInfo) => {
        try {
          const currentImplementation = await this.app.getProxyImplementation(proxyInfo.address)
          const contractImplementation = await this.app.getImplementation(contractAlias)
          if(currentImplementation !== contractImplementation) {
            await this.app.upgradeProxy(proxyInfo.address, contractClass, contractAlias, initMethod, initArgs);
            proxyInfo.implementation = await this.app.getImplementation(contractAlias);
          }
          else {
            log.info(`Contract ${contractAlias} at ${proxyInfo.address} is up to date.`)
            proxyInfo.implementation = currentImplementation
          }
          proxyInfo.version = newVersion;
        } catch(error) {
          failures.push({ proxyInfo, contractAlias, error })
        }
      });
    }));

    if(!_.isEmpty(failures)) {
      const message = failures.map(failure => `Proxy ${failure.contractAlias} at ${failure.proxyInfo.address} failed to update with ${failure.error.message}`).join('\n')
      throw Error(message)
    }
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
      return this.networkFile.proxies;
    }

    return {
      [contractAlias]: _.filter(this.networkFile.proxiesOf(contractAlias), proxy => (
        !proxyAddress || proxy.address === proxyAddress
      ))
    };
  }

  checkUpgrade(contractClass, calledMigrateMethod, calledMigrateArgs) {
    // If there is a migration called, assume it's ok
    if (calledMigrateMethod) return;

    // Otherwise, warn the user to invoke it
    const migrateMethod = contractClass.abi.find(fn => fn.type === 'function' && fn.name === 'migrate');
    if (!migrateMethod) return;
    log.error(`Possible migration method 'migrate' found in contract ${contractClass.contractName}. Remember running the migration after deploying it.`);
  }

  async linkStdlib() {
    if (!this.packageFile.hasStdlib()) {
      if (await this.app.hasStdlib()) {
        await this.app.setStdlib();
        this.networkFile.unsetStdlib()
      }
      return
    }

    const customDeployMatches = this.networkFile.hasCustomDeploy() && this.packageFile.stdlibMatches(this.networkFile.stdlib)
    if (customDeployMatches) {
      log.info(`Using existing custom deployment of stdlib at ${this.networkFile.stdlibAddress}`);
      return this.app.setStdlib(this.networkFile.stdlibAddress);
    }

    const stdlibName = this.packageFile.stdlibName;
    log.info(`Connecting to public deployment of ${stdlibName} in ${this.networkFile.network}`);

    const { address: stdlibAddress, version: stdlibVersion } = Stdlib.fetch(stdlibName, this.packageFile.stdlibVersion, this.networkFile.network);
    const currentStdlibAddress = await this.app.currentStdlib()

    if (stdlibAddress !== currentStdlibAddress) {
      await this.app.setStdlib(stdlibAddress);
      this.networkFile.stdlib = { 
         ... this.packageFile.stdlib, // name, customDeploy
         address: stdlibAddress, 
         version: stdlibVersion
      };
    } else {
      log.info(`Current application is already linked to stdlib ${stdlibName} at ${stdlibAddress} in ${this.network}`);
    }
  }

  isStdlibContract(contractAlias) {
    if (!this.packageFile.hasStdlib()) return false;
    const stdlib = new Stdlib(this.packageFile.stdlibName);
    return stdlib.hasContract(contractAlias);
  }

  isContractDefined(contractAlias) {
    return super.isContractDefined(contractAlias) || this.isStdlibContract(contractAlias);
  }

  _updateTruffleDeployedInformation(contractAlias, implementation) {
    const contractName = this.packageFile.contract(contractAlias)
    if (contractName) {
      const path = Contracts.getLocalPath(contractName)
      const data = fs.parseJson(path)
      data.networks = {}
      data.networks[implementation.constructor.network_id] = {
        links: {},
        events: {},
        address: implementation.address,
        updated_at: Date.now()
      }
      fs.writeJson(path, data)
    }
  }
}
