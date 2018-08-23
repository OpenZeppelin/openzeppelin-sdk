import _ from 'lodash';
import NetworkBaseController from './NetworkBaseController';
import { Contracts, Logger, AppProject, FileSystem as fs } from 'zos-lib';
import { toContractFullName } from '../../utils/naming';
import Dependency from '../dependency/Dependency';

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
    await this.linkLibs()
  }

  async deployLibs() {
    // TODO: Refactor `failures` pattern
    const failures = []
    const handlingFailure = async (dep, promise) => {
      try {
        await promise
      } catch(error) {
        failures.push({ dep, error })
      }
    };

    await Promise.all(
      _.map(this.packageFile.dependencies, (version, dep) => handlingFailure(dep, this.deployLibIfNeeded(dep, version))),
    )

    if(!_.isEmpty(failures)) {
      const message = failures.map(failure => `Failed local deployment of dependency ${failure.dep} with error ${failure.error.message}`).join('\n')
      throw Error(message)
    }
  }

  async deployLibIfNeeded(depName, depVersion) {
    const dependency = new Dependency(depName, depVersion)
    if (dependency.isDeployedOnNetwork(this.network) || this.networkFile.dependencyHasMatchingCustomDeploy(depName)) return
    log.info(`Deploying ${depName} contracts`)
    const deployment = await dependency.deploy(this.txParams)
    this.networkFile.setDependency(depName, { 
      package: (await deployment.getProjectPackage()).address,
      version: deployment.version,
      customDeploy: true
    })
  }

  async createProxy(packageName, contractAlias, initMethod, initArgs) {
    await this.fetch();
    if (!packageName) packageName = this.packageFile.name;
    const contractClass = this.localController.getContractClass(packageName, contractAlias);
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

    // Load project
    await this.fetch();

    // Check if there is any migrate method in the contracts and warn the user to call it
    const contracts = _.uniqWith(_.map(proxies, p => [p.package, p.contract]), _.isEqual)
    _.forEach(contracts, ([packageName, contractName]) => 
      this._checkUpgrade(this.localController.getContractClass(packageName, contractName), initMethod, initArgs)
    )

    const newVersion = await this.project.getCurrentVersion();
    

    // Update all proxies loaded
    // TODO: Refactor promises with failures pattern
    const failures = []
    await Promise.all(_.map(proxies, async proxy => {
      try {
        const contractClass = this.localController.getContractClass(proxy.package, proxy.contract);
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

  async linkLibs() {
    // TODO: Refactor `failures` pattern
    const failures = []
    const handlingFailure = async (dep, promise) => {
      try {
        await promise
      } catch(error) {
        failures.push({ dep, error })
      }
    };

    await Promise.all(_.concat(
      _.map(this.packageFile.dependencies, (version, dep) => handlingFailure(dep, this.linkLib(dep, version))),
      _.map(this.networkFile.dependenciesNamesMissingFromPackage(), dep => handlingFailure(dep, this.unlinkLib(dep)))
    ))

    if(!_.isEmpty(failures)) {
      const message = failures.map(failure => `Failed to link dependency ${failure.dep} with error: ${failure.error.message}`).join('\n')
      throw Error(message)
    }
  }

  async unlinkLib(depName) {
    if (await this.project.hasDependency(depName)) {
      log.info(`Unlinking dependency ${depName}`);
      await this.project.unsetDependency(depName);
    }
    this.networkFile.unsetDependency(depName);
  }

  async linkLib(depName, depVersion) {
    if (this.networkFile.dependencyHasMatchingCustomDeploy(depName)) {
      log.info(`Using custom deployment of ${depName}`);
      const depInfo = this.networkFile.getDependency(depName);
      return await this.project.setDependency(depName, depInfo.package, depInfo.version);
    }

    const dependencyInfo = (new Dependency(depName, depVersion)).getNetworkFile(this.network)
    const currentDependency = this.networkFile.getDependency(depName)

    if (!currentDependency || currentDependency.package !== dependencyInfo.packageAddress) {
      log.info(`Connecting to dependency ${depName} ${dependencyInfo.version}`);
      await this.project.setDependency(depName, dependencyInfo.packageAddress, dependencyInfo.version)
      const depInfo = { package: dependencyInfo.packageAddress, version: dependencyInfo.version }
      this.networkFile.setDependency(depName, depInfo)
    }
  }

  _errorForContractDeployed(packageName, contractAlias) {
    if (packageName === this.packageFile.name) {
      return this._errorForLocalContractDeployed(contractAlias)
    } else if (!this.packageFile.hasDependency(packageName)) {
      return `Dependency ${packageName} not found in project.`
    } else if (!this.networkFile.hasDependency(packageName)) {
      return `Dependency ${packageName} has not been linked yet. Please run zos push.`
    } else if (!(new Dependency(packageName)).getPackageFile().contract(contractAlias)) {
      return `Contract ${contractAlias} is not provided by ${packageName}.`
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
