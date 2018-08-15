import _ from 'lodash';
import Stdlib from '../stdlib/Stdlib';
import NetworkBaseController from './NetworkBaseController';
import { Contracts, Logger, AppProject, FileSystem as fs } from 'zos-lib';
import { toContractFullName } from '../../utils/naming';

const log = new Logger('NetworkAppController');

export default class NetworkAppController extends NetworkBaseController {
  get isDeployed() {
    return !!this.appAddress;
  }

  get appAddress() {
    return this.networkFile.appAddress
  }

  async deploy() {
    this.project = await AppProject.deploy(this.packageFile.name, this.currentVersion, this.txParams);
    
    const app = this.project.getApp()
    this.networkFile.app = { address: app.address };

    const thepackage = await this.project.getProjectPackage()
    this.networkFile.package = { address: thepackage.address };

    const directory = await this.project.getCurrentDirectory()    
    this._registerVersion(this.currentVersion, directory.address);
  }

  async fetch() {
    if (!this.isDeployed) throw Error('Your application must be deployed to interact with it.');
    this.project = await AppProject.fetch(this.appAddress, this.packageFile.name, this.txParams);
  }

  async push(reupload = false) {
    await super.push(reupload);
    // await this.linkStdlib()
  }

  async deployStdlib() {
    // if (!this.packageFile.hasStdlib()) return this.networkFile.unsetStdlib()
    // const stdlibAddress = await Stdlib.deploy(this.packageFile.stdlibName, this.txParams);
    // this.networkFile.stdlib = { address: stdlibAddress, customDeploy: true, ... this.packageFile.stdlib };
  }

  async createProxy(packageName, contractAlias, initMethod, initArgs) {
    await this.fetch();
    if (!packageName) packageName = this.packageFile.name;
    const contractClass = this.localController.getContractClass(contractAlias);
    this.checkInitialization(contractClass, initMethod, initArgs);
    const proxyInstance = await this.project.createProxy(contractClass, { packageName, contractName: contractAlias, initMethod, initArgs });
    const implementationAddress = await this.project.app.getImplementation(packageName, contractAlias);
    // FIXME: Shouldn't truffle deployed info correspond to the contract name, and not its alias?
    this._updateTruffleDeployedInformation(contractAlias, proxyInstance)

    this.networkFile.addProxy(packageName, contractAlias, {
      address: proxyInstance.address,
      version: this.project.version,
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

  async upgradeProxies(packageName, contractAlias, proxyAddress, initMethod, initArgs) {
    // Fetch all proxies that match the filters provided
    const proxies = this.networkFile.getProxies({ package: packageName, contract: contractAlias, address: proxyAddress})
    if (_.isEmpty(proxies)) {
      log.info('No proxies to update were found');
      return;      
    }

    await this.fetch();

    // Check if there is any migrate method in the contracts and warn the user to call it
    const contractAliases = _.uniq(_.map(proxies, 'contract'))
    _.forEach(contractAliases, alias => 
      this._checkUpgrade(this.localController.getContractClass(alias), initMethod, initArgs)
    )

    const newVersion = await this.project.getCurrentVersion();
    const failures = []

    // Update all proxies loaded
    await Promise.all(_.map(proxies, async proxy => {
      try {
        const contractClass = this.localController.getContractClass(proxy.contract);
        const currentImplementation = await this.project.app.getProxyImplementation(proxy.address)
        const contractImplementation = await this.project.app.getImplementation(proxy.package, proxy.contract)
        if (currentImplementation !== contractImplementation) {
          await this.project.upgradeProxy(proxy.address, contractClass, { packageName: proxy.package, contractName: proxy.contract, initMethod, initArgs });
          proxy.implementation = contractImplementation
        } else {
          log.info(`Contract ${proxy.contract} at ${proxy.address} is up to date.`)
          proxy.implementation = currentImplementation
        }
        proxy.version = newVersion;
        this.networkFile.updateProxy(proxy)
      } catch(error) {
        failures.push({ proxy, error })
      }
    }));

    if(!_.isEmpty(failures)) {
      const message = failures.map(failure => `Proxy ${toContractFullName(failure.proxy.package, failure.proxy.contract)} at ${failure.proxy.address} failed to update with ${failure.error.message}`).join('\n')
      throw Error(message)
    }

    return proxies;
  }

  _checkUpgrade(contractClass, calledMigrateMethod, calledMigrateArgs) {
    // If there is a migration called, assume it's ok
    if (calledMigrateMethod) return;

    // Otherwise, warn the user to invoke it
    const migrateMethod = contractClass.abi.find(fn => fn.type === 'function' && fn.name === 'migrate');
    if (!migrateMethod) return;
    log.error(`Possible migration method 'migrate' found in contract ${contractClass.contractName}. Remember running the migration after deploying it.`);
  }

  async linkStdlib() {
    // if (!this.packageFile.hasStdlib()) {
    //   if (await this.project.hasStdlib()) {
    //     await this.project.setStdlib();
    //     this.networkFile.unsetStdlib()
    //   }
    //   return
    // }

    // const customDeployMatches = this.networkFile.hasCustomDeploy() && this.packageFile.stdlibMatches(this.networkFile.stdlib)
    // if (customDeployMatches) {
    //   log.info(`Using existing custom deployment of stdlib at ${this.networkFile.stdlibAddress}`);
    //   return this.project.setStdlib(this.networkFile.stdlibAddress);
    // }

    // const stdlibName = this.packageFile.stdlibName;
    // log.info(`Connecting to public deployment of ${stdlibName} in ${this.networkFile.network}`);

    // const { address: stdlibAddress, version: stdlibVersion } = Stdlib.fetch(stdlibName, this.packageFile.stdlibVersion, this.networkFile.network);
    // const currentStdlibAddress = await this.project.currentStdlib()

    // if (stdlibAddress !== currentStdlibAddress) {
    //   await this.project.setStdlib(stdlibAddress);
    //   this.networkFile.stdlib = { 
    //      ... this.packageFile.stdlib, // name, customDeploy
    //      address: stdlibAddress, 
    //      version: stdlibVersion
    //   };
    // } else {
    //   log.info(`Current application is already linked to stdlib ${stdlibName} at ${stdlibAddress} in ${this.network}`);
    // }
  }

  isStdlibContract(contractAlias) {
    if (!this.packageFile.hasStdlib()) return false;
    const stdlib = new Stdlib(this.packageFile.stdlibName);
    return stdlib.hasContract(contractAlias);
  }

  isContractDefined(contractAlias) {
    return super.isContractDefined(contractAlias) || this.isStdlibContract(contractAlias);
  }

  _errorForLocalContractDeployed(contractAlias) {
    const baseErr = super._errorForLocalContractDeployed(contractAlias);
    if (baseErr) {
      return baseErr;
    } else if (this.isStdlibContract(contractAlias) && !this.networkFile.hasStdlib()) {
      return `Contract ${contractAlias} is provided by ${this.packageFile.stdlibName} but it was not deployed to the network, consider running \`zos push\``;
    }
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
