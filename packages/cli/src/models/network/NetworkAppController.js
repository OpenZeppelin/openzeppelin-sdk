import _ from 'lodash';
import NetworkBaseController from './NetworkBaseController';
import { Contracts, Logger, AppProject, FileSystem as fs } from 'zos-lib';
import { toContractFullName } from '../../utils/naming';
import Dependency from '../dependency/Dependency';
import { allPromisesOrError } from '../../utils/async';

const log = new Logger('NetworkAppController');

export default class NetworkAppController extends NetworkBaseController {
  get appAddress() {
    return this.networkFile.appAddress
  }

  get app() {
    return this.project.getApp()
  }

  async fetchOrDeploy() {
    try {
      const { appAddress, packageAddress } = this

      this.project = await AppProject.fetchOrDeploy(this.packageFile.name, this.currentVersion, this.txParams, { appAddress, packageAddress })
      this._registerApp(this.project.getApp())
      this._registerPackage(await this.project.getProjectPackage())
      this._registerVersion(this.currentVersion, await this.project.getCurrentDirectory())
    } catch (deployError) {
      this._tryRegisterPartialDeploy(deployError)
    }
  }

  _tryRegisterPartialDeploy({ thepackage, app, directory }) {
    super._tryRegisterPartialDeploy({ thepackage, directory })
    if (app) this._registerApp(app)
  }

  _registerApp({ address }) {
    this.networkFile.app = { address }
  }

  async push(reupload = false, force = false) {
    await super.push(reupload, force);
    await this.handleLibsLink()
  }

  async deployLibs() {
    await allPromisesOrError(
      _.map(this.packageFile.dependencies, (version, dep) => this.deployLibIfNeeded(dep, version))
    )
  }

  async deployLibIfNeeded(depName, depVersion) {
    try {
      const dependency = new Dependency(depName, depVersion)
      if (dependency.isDeployedOnNetwork(this.network) || this.networkFile.dependencyHasMatchingCustomDeploy(depName)) return
      log.info(`Deploying ${depName} contracts`)
      const deployment = await dependency.deploy(this.txParams)
      this.networkFile.setDependency(depName, { 
        package: (await deployment.getProjectPackage()).address,
        version: deployment.version,
        customDeploy: true
      })
    } catch (err) {
      throw Error(`Failed deployment of dependency ${depName} with error: ${err.message}`)
    }
  }

  async createProxy(packageName, contractAlias, initMethod, initArgs) {
    await this.fetchOrDeploy()
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

  async setProxiesAdmin(packageName, contractAlias, proxyAddress, newAdmin) {
    const proxies = this._fetchOwnedProxies(packageName, contractAlias, proxyAddress)
    if (proxies.length === 0) return [];
    await this.fetchOrDeploy()

    await allPromisesOrError(
      _.map(proxies, async (proxy) => {
        await this.project.changeProxyAdmin(proxy.address, newAdmin)
        this.networkFile.updateProxy(proxy, proxy => ({ ... proxy, admin: newAdmin }))
      })
    );

    return proxies;
  }

  async upgradeProxies(packageName, contractAlias, proxyAddress, initMethod, initArgs) {
    const proxies = this._fetchOwnedProxies(packageName, contractAlias, proxyAddress)
    if (proxies.length === 0) return [];
    await this.fetchOrDeploy()

    // Check if there is any migrate method in the contracts and warn the user to call it
    const contracts = _.uniqWith(_.map(proxies, p => [p.package, p.contract]), _.isEqual)
    _.forEach(contracts, ([packageName, contractName]) => 
      this._checkUpgrade(this.localController.getContractClass(packageName, contractName), initMethod, initArgs)
    )

    // Update all proxies loaded
    const newVersion = await this.project.getCurrentVersion();
    await allPromisesOrError(
      _.map(proxies, (proxy) => this._upgradeProxy(proxy, initMethod, initArgs, newVersion))
    )

    return proxies;
  }

  async _upgradeProxy(proxy, initMethod, initArgs, newVersion) {
    try {
      const contractClass = this.localController.getContractClass(proxy.package, proxy.contract);
      const currentImplementation = await this.project.app.getProxyImplementation(proxy.address)
      const contractImplementation = await this.project.app.getImplementation(proxy.package, proxy.contract)
      let newImplementation;

      if (currentImplementation !== contractImplementation) {
        await this.project.upgradeProxy(proxy.address, contractClass, { packageName: proxy.package, contractName: proxy.contract, initMethod, initArgs });
        newImplementation = contractImplementation
      } else {
        log.info(`Contract ${proxy.contract} at ${proxy.address} is up to date.`)
        newImplementation = currentImplementation
      }

      this.networkFile.updateProxy(proxy, proxy => ({
        ... proxy,
        implementation: newImplementation,
        version: newVersion
      }));
    } catch(error) {
      throw Error(`Proxy ${toContractFullName(proxy.package, proxy.contract)} at ${proxy.address} failed to update with error: ${error.message}`)
    }
  }

  _checkUpgrade(contractClass, calledMigrateMethod, calledMigrateArgs) {
    // If there is a migration called, assume it's ok
    if (calledMigrateMethod) return;

    // Otherwise, warn the user to invoke it
    const migrateMethod = contractClass.abi.find(fn => fn.type === 'function' && fn.name === 'migrate');
    if (!migrateMethod) return;
    log.error(`Possible migration method 'migrate' found in contract ${contractClass.contractName}. Remember running the migration after deploying it.`);
  }

  _fetchOwnedProxies(packageName, contractAlias, proxyAddress) {
    let criteriaDescription;
    if (packageName || contractAlias) criteriaDescription += ` contract ${toContractFullName(packageName, contractAlias)}`
    if (proxyAddress) criteriaDescription += ` address ${proxyAddress}`
    
    const proxies = this.networkFile.getProxies({ 
      package: packageName || (contractAlias ? this.packageFile.name : undefined),
      contract: contractAlias, 
      address: proxyAddress
    })

    if (_.isEmpty(proxies)) {
      log.info(`No contract instances that match${criteriaDescription} were found`);
      return [];
    }

    const ownedProxies = proxies.filter(proxy => !proxy.admin || proxy.admin === this.appAddress);

    if (_.isEmpty(ownedProxies)) {
      log.info(`No contract instances that match${criteriaDescription} are owned by this application`);
    }

    return ownedProxies;
  }

  async handleLibsLink() {
    await allPromisesOrError(_.concat(
      _.map(this.packageFile.dependencies, (version, dep) => this.linkLib(dep, version)),
      _.map(this.networkFile.dependenciesNamesMissingFromPackage(), dep => this.unlinkLib(dep))
    ))
  }

  async unlinkLib(depName) {
    try {
      if (await this.project.hasDependency(depName)) {
        log.info(`Unlinking dependency ${depName}`);
        await this.project.unsetDependency(depName);
      }
      this.networkFile.unsetDependency(depName);
    } catch (error) {
      throw Error(`Failed to unlink dependency ${depName} with error: ${error.message}`)
    }
  }

  async linkLib(depName, depVersion) {
    try {
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
    } catch(error) {
      throw Error(`Failed to link dependency ${depName}@${depVersion} with error: ${error.message}`)
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
