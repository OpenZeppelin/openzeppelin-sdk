import _ from 'lodash';
import { Contracts, Logger, flattenSourceCode, getStorageLayout, getBuildArtifacts, getSolidityLibNames } from 'zos-lib';
import { validate, newValidationErrors, validationPasses } from 'zos-lib';
import StatusChecker from "../status/StatusChecker";
import Verifier from '../Verifier'
import { allPromisesOrError } from '../../utils/async';
import ValidationLogger from '../../interface/ValidationLogger';

const log = new Logger('NetworkController');

export default class NetworkBaseController {
  constructor(localController, network, txParams, networkFile = undefined) {
    this.localController = localController;
    this.txParams = txParams;
    this.network = network;
    this.networkFile = networkFile || localController.packageFile.networkFile(network)
  }

  get packageFile() {
    return this.localController.packageFile;
  }

  get packageVersion() {
    return this.packageFile.version;
  }

  get currentVersion() {
    return this.networkFile.version;
  }

  get packageAddress() {
    return this.networkFile.packageAddress
  }

  getDeployer() {
    throw Error("Unimplemented function getDeployer()");
  }

  get isLib() {
    return this.packageFile.isLib;
  }

  get isLightweight() {
    return false;
  }

  async fetchOrDeploy(requestedVersion) {
    this.project = await this.getDeployer(requestedVersion).fetchOrDeploy()
    return this.project
  }

  async compareCurrentStatus() {
    if (this.isLightweight) throw Error('Command status-pull is not supported for unpublished projects' )
    const statusComparator = StatusChecker.compare(this.networkFile, this.txParams)
    await statusComparator.call()
  }

  async pullRemoteStatus() {
    if (this.isLightweight) throw Error('Command status-fix is not supported for unpublished projects' )
    const statusFetcher = StatusChecker.fetch(this.networkFile, this.txParams)
    await statusFetcher.call()
  }

  async createProxy() {
    throw Error('Unimplemented function createProxy()')
  }

  async push(reupload = false, force = false) {
    const changedLibraries = this._solidityLibsForPush(!reupload)
    const contracts = this._contractsListForPush(!reupload, changedLibraries)
    const buildArtifacts = getBuildArtifacts();

    // ValidateContracts also extends each contract class with validation errors and storage info
    if (!this.validateContracts(contracts, buildArtifacts) && !force) {
      throw Error('One or more contracts have validation errors. Please review the items listed above and fix them, or run this command again with the --force option.')
    }

    this._checkVersion()
    await this.fetchOrDeploy(this.packageVersion)
    await this.handleLibsLink();
    
    this.checkNotFrozen();
    await this.uploadSolidityLibs(changedLibraries);
    await Promise.all([
      this.uploadContracts(contracts), 
      this.unsetContracts()
    ])

    await this._unsetSolidityLibs()
  }

  async handleLibsLink() {
    return;
  }

  checkNotFrozen() {
    if (this.networkFile.frozen) {
      throw Error('Cannot modify contracts in a frozen version. Run zos bump to create a new version first.');
    }
  }

  async newVersion(versionName) {
    return this.project.newVersion(versionName);
  }

  _checkVersion() {
    if (this._newVersionRequired()) {
      log.info(`Current version ${this.currentVersion}`);
      log.info(`Creating new version ${this.packageVersion}`);
      this.networkFile.frozen = false;
      this.networkFile.contracts = {};
    }
  }

  _newVersionRequired() {
    return (this.packageVersion !== this.currentVersion) && !this.isLightweight;
  }

  _contractsListForPush(onlyChanged = false, changedLibraries = []) {
    const newVersion = this._newVersionRequired()
    return _(this.packageFile.contracts)
      .toPairs()
      .map(([contractAlias, contractName]) => [contractAlias, Contracts.getFromLocal(contractName)])
      .filter(([contractAlias, contractClass]) => newVersion || !onlyChanged || this.hasContractChanged(contractAlias, contractClass) || this._hasChangedLibraries(contractClass, changedLibraries))
      .value()
  }

  _solidityLibsForPush(onlyChanged = false) {
    const { contractNames, contractAliases } = this.packageFile
    const libNames = this._getAllSolidityLibNames(contractNames)
    
    const clashes = _.intersection(libNames, contractAliases)
    if(!_.isEmpty(clashes)) {
      throw new Error(`Cannot upload libraries with the same name as a contract alias: ${clashes.join(', ')}`)
    }

    return libNames
      .map(libName => Contracts.getFromLocal(libName))
      .filter(libClass => {
        const hasSolidityLib = this.networkFile.hasSolidityLib(libClass.contractName)
        const hasChanged = this._hasSolidityLibChanged(libClass)
        return (!hasSolidityLib || !onlyChanged || hasChanged);
      });
  }

  async uploadSolidityLibs(libs) {
    await allPromisesOrError(
      libs.map(lib => this._uploadSolidityLib(lib))
    )
  }

  async _uploadSolidityLib(libClass) {
    const libName = libClass.contractName
    log.info(`Uploading ${libName} library...`)
    const libInstance = await this.project.setImplementation(libClass, libName)
    this.networkFile.addSolidityLib(libName, libInstance)
  }

  async uploadContracts(contracts) {
    await allPromisesOrError(
      contracts.map(([contractAlias, contractClass]) => this.uploadContract(contractAlias, contractClass))
    )
  }

  async uploadContract(contractAlias, contractClass) {
    try {
      const currentContractLibs = getSolidityLibNames(contractClass.bytecode)
      const libraries = this.networkFile.getSolidityLibs(currentContractLibs)
      log.info(`Uploading ${contractClass.contractName} contract as ${contractAlias}`);
      await contractClass.link(libraries);
      const contractInstance = await this.project.setImplementation(contractClass, contractAlias);
      this.networkFile.addContract(contractAlias, contractInstance, {
        warnings: contractClass.warnings,
        types: contractClass.storageInfo.types,
        storage: contractClass.storageInfo.storage
      })
    } catch(error) {
      throw Error(`${contractAlias} deployment failed with error: ${error.message}`)
    }
  }

  async _unsetSolidityLibs() {
    const { contractNames } = this.packageFile
    const libNames = this._getAllSolidityLibNames(contractNames)
    await allPromisesOrError(
      this.networkFile.solidityLibsMissing(libNames).map(libName => this._unsetSolidityLib(libName))
    )
  }

  async _unsetSolidityLib(libName) {
    try {
      log.info(`Removing ${libName} library`);
      await this.project.unsetImplementation(libName);
      this.networkFile.unsetSolidityLib(libName)
    } catch(error) {
      throw Error(`Removal of ${libName} failed with error: ${error.message}`)
    }
  }

  _hasChangedLibraries(contractClass, changedLibraries) {
    const libNames = getSolidityLibNames(contractClass.bytecode)
    return !_.isEmpty(_.intersection(changedLibraries.map(c => c.contractName), libNames))
  }

  _getAllSolidityLibNames(contractNames) {
    const libNames = contractNames.map(contractName => {
      const contractClass = Contracts.getFromLocal(contractName)
      return getSolidityLibNames(contractClass.bytecode)
    })

    return _.uniq(_.flatten(libNames))
  }

  async unsetContracts() {
    await allPromisesOrError(
      this.networkFile.contractAliasesMissingFromPackage().map(contractAlias => this.unsetContract(contractAlias))
    )
  }

  async unsetContract(contractAlias) {
    try {
      log.info(`Removing ${contractAlias} contract`);
      await this.project.unsetImplementation(contractAlias);
      this.networkFile.unsetContract(contractAlias)
    } catch(error) {
      throw Error(`Removal of ${contractAlias} failed with error: ${error.message}`)
    }
  }

  validateContracts(contracts, buildArtifacts) {
    return _.every(contracts.map(([contractAlias, contractClass]) => 
      this.validateContract(contractAlias, contractClass, buildArtifacts))
    )
  }

  validateContract(contractAlias, contractClass, buildArtifacts) {
    log.info(`Validating contract ${contractClass.contractName}`);
    const existingContractInfo = this.networkFile.contract(contractAlias) || {};
    const warnings = validate(contractClass, existingContractInfo, buildArtifacts);
    const newWarnings = newValidationErrors(warnings, existingContractInfo.warnings);

    const validationLogger = new ValidationLogger(contractClass, existingContractInfo);
    validationLogger.log(newWarnings, buildArtifacts);
    
    contractClass.warnings = warnings;
    contractClass.storageInfo = getStorageLayout(contractClass, buildArtifacts);
    return validationPasses(newWarnings);
  }

  checkContractDeployed(packageName, contractAlias, throwIfFail = false) {
    if (!packageName) packageName = this.packageFile.name;
    const err = this._errorForContractDeployed(packageName, contractAlias);
    if (err) this._handleErrorMessage(err, throwIfFail);
  }

  _errorForContractDeployed(packageName, contractAlias) {
    return this._errorForLocalContractDeployed(contractAlias)
  }

  checkLocalContractsDeployed(throwIfFail = false) {
    const err = this._errorForLocalContractsDeployed();
    if (err) this._handleErrorMessage(err, throwIfFail);
  }

  _errorForLocalContractsDeployed() {
    const [contractsDeployed, contractsMissing] = _.partition(this.packageFile.contractAliases, (alias) => this.isContractDeployed(alias));
    const contractsChanged = _.filter(contractsDeployed, (alias) => this.hasContractChanged(alias));

    if (!_.isEmpty(contractsMissing)) {
      return `Contracts ${contractsMissing.join(', ')} are not deployed.`;
    } else if (!_.isEmpty(contractsChanged)) {
      return `Contracts ${contractsChanged.join(', ')} have changed since the last deploy.`;
    }
  }

  checkLocalContractDeployed(contractAlias, throwIfFail = false) {
    // if (!packageName) packageName = this.packageFile.name
    const err = this._errorForLocalContractDeployed(contractAlias);
    if (err) this._handleErrorMessage(err, throwIfFail);
  }

  _errorForLocalContractDeployed(contractAlias) {
    if (!this.isContractDefined(contractAlias)) {
      return `Contract ${contractAlias} not found in this project`;
    } else if (!this.isContractDeployed(contractAlias)) {
      return `Contract ${contractAlias} is not deployed to ${this.network}.`;
    } else if (this.hasContractChanged(contractAlias)) {
      return `Contract ${contractAlias} has changed locally since the last deploy, consider running 'zos push'.`;
    }
  }

  _handleErrorMessage(msg, throwIfFail = false) {
    if (throwIfFail) {
      throw Error(msg);
    } else {
      log.info(msg);
    }
  }

  _hasSolidityLibChanged(libClass) {
    return !this.networkFile.hasSameBytecode(libClass.contractName, libClass)
  }

  hasContractChanged(contractAlias, contractClass = undefined) {
    if (!this.isLocalContract(contractAlias)) return false;
    if (!this.isContractDeployed(contractAlias)) return true;
    
    if (!contractClass) {
      const contractName = this.packageFile.contract(contractAlias);
      contractClass = Contracts.getFromLocal(contractName);
    }
    return !this.networkFile.hasSameBytecode(contractAlias, contractClass)
  }

  isLocalContract(contractAlias) {
    return this.packageFile.hasContract(contractAlias)
  }

  isContractDefined(contractAlias) {
    return this.packageFile.hasContract(contractAlias)
  }

  isContractDeployed(contractAlias) {
    return !this.isLocalContract(contractAlias) || this.networkFile.hasContract(contractAlias);
  }

  async verifyAndPublishContract(contractAlias, optimizer, optimizerRuns, remote, apiKey) {
    const contractName = this.packageFile.contract(contractAlias)
    const { compilerVersion, sourcePath } = this.localController.getContractSourcePath(contractAlias)
    const contractSource = await flattenSourceCode([sourcePath])
    const contractAddress = this.networkFile.contracts[contractAlias].address
    log.info(`Verifying and publishing ${contractAlias} on ${remote}`)

    await Verifier.verifyAndPublish(remote, { contractName, compilerVersion, optimizer, optimizerRuns, contractSource, contractAddress, apiKey, network: this.network })
  }

  writeNetworkPackageIfNeeded() {
    this.networkFile.write()
  }

  async freeze() {
    if (!this.packageAddress) throw Error('Cannot freeze an unpublished project')
    await this.fetchOrDeploy(this.currentVersion)
    await this.project.freeze()
    this.networkFile.frozen = true
  }
}
