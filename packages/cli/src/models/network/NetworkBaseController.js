import _ from 'lodash';
import { Contracts, Logger, flattenSourceCode, getStorageLayout, getBuildArtifacts, compareStorageLayouts, getStructsOrEnums } from 'zos-lib';
import StatusChecker from "../status/StatusChecker";
import Verifier from '../Verifier'
import { allPromisesOrError } from '../../utils/async';
import { logUncheckedVars, logStorageLayoutDiffs } from '../../interface/Validations';

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
    return this.packageFile.isLightweight;
  }

  async fetchOrDeploy(requestedVersion) {
    this.project = await this.getDeployer(requestedVersion).fetchOrDeploy()
  }

  async compareCurrentStatus() {
    if (this.isLightweight) throw Error('Command status-pull is not supported for lightweight apps' )
    const statusComparator = StatusChecker.compare(this.networkFile, this.txParams)
    await statusComparator.call()
  }

  async pullRemoteStatus() {
    if (this.isLightweight) throw Error('Command status-fix is not supported for lightweight apps' )
    const statusFetcher = StatusChecker.fetch(this.networkFile, this.txParams)
    await statusFetcher.call()
  }

  async createProxy() {
    throw Error('Unimplemented function createProxy()')
  }

  async push(reupload = false, force = false) {
    const contracts = this._contractsListForPush(!reupload)
    const buildArtifacts = getBuildArtifacts();

    if (!this.validateContracts(contracts, buildArtifacts) && !force) {
      throw Error('Please review the warnings listed above and fix them, or run the command again with the --force option.')
    }

    this._checkVersion()
    await this.fetchOrDeploy(this.packageVersion)

    await Promise.all([
      this.uploadContracts(contracts, buildArtifacts), 
      this.unsetContracts()
    ])
  }

  _checkVersion() {
    if (this._newVersionRequired()) {
      log.info(`Current version ${this.currentVersion}`);
      log.info(`Creating new version ${this.packageVersion}`);
      this.networkFile.contracts = {};
    }
  }

  _newVersionRequired() {
    return (this.packageVersion !== this.currentVersion) && !this.isLightweight;
  }

  _contractsListForPush(onlyChanged = false) {
    const newVersion = this._newVersionRequired()
    return _(this.packageFile.contracts)
      .toPairs()
      .filter(([contractAlias, _contractName]) => newVersion || !onlyChanged || this.hasContractChanged(contractAlias))
      .value()
  }

  async newVersion(versionName) {
    return this.project.newVersion(versionName);
  }

  async uploadContracts(contracts, buildArtifacts) {
    await allPromisesOrError(
      contracts.map(([contractAlias, contractName]) => this.uploadContract(contractAlias, contractName, buildArtifacts))
    )
  }

  async uploadContract(contractAlias, contractName, buildArtifacts) {
    try {
      const contractClass = Contracts.getFromLocal(contractName);
      log.info(`Uploading ${contractName} contract as ${contractAlias}`);
      const contractInstance = await this.project.setImplementation(contractClass, contractAlias);
      this.networkFile.addContract(contractAlias, contractInstance, getStorageLayout(contractClass, buildArtifacts))
    } catch(error) {
      throw Error(`${contractAlias} deployment failed with error: ${error.message}`)
    }
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
    return _.every(contracts.map(([contractAlias, contractName]) => this.validateContract(contractAlias, contractName, buildArtifacts)))
  }

  validateContract(contractAlias, contractName, buildArtifacts) {
    log.info(`Validating contract ${contractName} before push`)
    const originalStorageInfo = _.pick(this.networkFile.contract(contractAlias), 'storage', 'types')
    if (_.isEmpty(originalStorageInfo.storage)) return true;
    const contract = Contracts.getFromLocal(contractName);
    const updatedStorageInfo = getStorageLayout(contract, buildArtifacts)
    const uncheckedVars = getStructsOrEnums(updatedStorageInfo)
    logUncheckedVars(uncheckedVars, log)
    const storageDiff = compareStorageLayouts(originalStorageInfo, updatedStorageInfo)
    logStorageLayoutDiffs(storageDiff, originalStorageInfo, updatedStorageInfo, log)

    // Validation passes only if all diff kinds are appends
    return _.every(storageDiff, diff => diff.action === 'append')
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

  hasContractChanged(contractAlias) {
    if (!this.isLocalContract(contractAlias)) return false;
    if (!this.isContractDeployed(contractAlias)) return true;
    const contractName = this.packageFile.contract(contractAlias);
    const contractClass = Contracts.getFromLocal(contractName);
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

  async verifyAndPublishContract(contractAlias, optimizer, optimizerRuns, remote) {
    const contractName = this.packageFile.contract(contractAlias)
    const { compilerVersion, sourcePath } = this.localController.getContractSourcePath(contractAlias)
    const contractSource = await flattenSourceCode([sourcePath])
    const contractAddress = this.networkFile.contracts[contractAlias].address
    log.info(`Verifying and publishing ${contractAlias} on ${remote}`)

    await Verifier.verifyAndPublish(remote, { contractName, compilerVersion, optimizer, optimizerRuns, contractSource, contractAddress })
  }

  writeNetworkPackage() {
    this.networkFile.write()
  }
}
