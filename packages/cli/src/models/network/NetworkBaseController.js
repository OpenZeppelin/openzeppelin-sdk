import _ from 'lodash';
import { Contracts, Logger, App, FileSystem as fs } from 'zos-lib';
import StatusComparator from '../status/StatusComparator'
import StatusChecker from "../status/StatusChecker";
import Verifier from '../Verifier'
import { flattenSourceCode } from '../../utils/contracts'
import { allPromisesOrError } from '../../utils/async';
import { getStorageLayout, getBuildArtifacts, compareStorageLayouts } from 'zos-lib/src';

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

  get currentVersion() {
    return this.packageFile.version;
  }

  get packageAddress() {
    return this.networkFile.packageAddress
  }

  get isDeployed() {
    throw Error("Unimplemented function isDeployed()");
  }

  get isLib() {
    return this.packageFile.isLib;
  }

  async compareCurrentStatus() {
    const statusComparator = StatusChecker.compare(this.networkFile, this.txParams)
    await statusComparator.call()
  }

  async pullRemoteStatus() {
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

    if (this.isDeployed) {
      await this.fetch();
      await this.pushVersion();
    } else {
      await this.deploy();
    }

    await Promise.all([
      this.uploadContracts(contracts, buildArtifacts), 
      this.unsetContracts()
    ])
  }

  async pushVersion() {
    if (this._newVersionRequired()) {
      const requestedVersion = this.packageFile.version;
      const currentVersion = this.networkFile.version;
      log.info(`Current version ${currentVersion}`);
      log.info(`Creating new version ${requestedVersion}`);
      const provider = await this.newVersion(requestedVersion);
      this.networkFile.contracts = {};
      this._registerVersion(requestedVersion, provider.address);
    }
  }

  _registerVersion(version, providerAddress) {
    this.networkFile.provider = { address: providerAddress };
    this.networkFile.version = version;
  }

  _newVersionRequired() {
    const requestedVersion = this.packageFile.version;
    const currentVersion = this.networkFile.version;
    return (requestedVersion !== currentVersion);
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
    const diff = compareStorageLayouts(originalStorageInfo, updatedStorageInfo)
    if (!_.isEmpty(diff)) {
      this._logStorageLayoutDiffs(contract, diff, originalStorageInfo, updatedStorageInfo, buildArtifacts)
      log.info('Read more at https://docs.zeppelinos.org/docs/advanced.html#preserving-the-storage-structure')
      return false
    }

    return true
  }

  _logStorageLayoutDiffs(contract, storageDiff, originalStorageInfo, updatedStorageInfo, buildArtifacts) {
    storageDiff.forEach(({ updated, original, action }) => {
      const updatedSourceCode = updated && fs.exists(updated.path) && fs.read(updated.path)
      const updatedVarType = updated && updatedStorageInfo.types[updated.type];
      const updatedVarSource = updated && [updated.path, this._srcToLineNumber(updated.path, updated.src)].join(':');
      const updatedVarDescription = updated && 
        (this._tryGetSourceFragment(updatedSourceCode, updatedVarType.src) 
         || [updatedVarType.label, updated.label].join(' '));
      
      const originalVarType = original && originalStorageInfo.types[original.type];
      const originalVarDescription = original && [originalVarType.label, original.label].join(' ');

      switch (action) {
        case 'insert':
          log.error(`New variable '${updatedVarDescription}' was added in contract ${updated.contract} in ${updatedVarSource} before ` +
                    `variable '${updatedStorageInfo[updated.index + 1].label}'.\n`+
                    `This pushes all variables after ${updated.label} to a higher position in storage, `+
                    `causing the updated contract to read incorrect initial values. Only add new variables at the `+
                    `end of your contract to prevent this issue`);
          break;
        case 'delete':
          log.error(`Variable '${originalVarDescription}' was removed from contract ${original.contract}.\n`+
                    `This will move all variables after ${original.label} to a lower position in storage, `+
                    `causing the updated contract to read incorrect initial values. Avoid deleting existing ` +
                    `variables to prevent this issue, and rename them to communicate that they are not to be used.`);
          break;
        case 'append':
          log.info(`New variable '${updatedVarDescription}' was added in contract ${updated.contract} in ${updatedVarSource} `+
                   `at the end of the contract. This does not alter the original storage, and should be a safe change.`)
          break;
        case 'pop':
          log.warn(`Variable '${originalVarDescription}' was removed from the end of contract ${original.contract}.\n`+
                    `Though this will not alter the positions in storage of other variables, if a new variable is added ` +
                    `at the end of the contract, it will have the initial value of ${original.label} when upgrading. ` +
                    `Avoid deleting existing variables to prevent this issue, and rename them to communicate that they are not to be used.`);
          break;
        case 'rename':
          log.warn(`Variable '${originalVarDescription}' in contract ${original.contract} was renamed to ${updated.label} in ${updatedVarSource}.\n` +
                   `Note that the new variable ${updated.label} will have the value of ${original.label} after upgrading. ` +
                   `If this is not the desired behavior, add a new variable ${updated.label} at the end of your contract instead.`)
          break;
        case 'typechange':
          log.warn(`Variable ${original.label} in contract ${original.contract} was changed from ${originalVarType.label} \n` +
                   `to ${updatedVarType.label} in ${updatedVarSource}. If ${updatedVarType.label} is not compatible with ${originalVarType.label}, ` +
                   `then ${updated.label} could be initialized with an invalid value after upgrading. Avoid changing types of existing ` +
                   `variables to prevent this issue, and declare new ones at the end of your contract instead.`)
        default:
          log.error(`Unexpected layout changeset: ${action}`)
      }
    });
  }

  _srcToLineNumber(sourceCode, srcFragment) {
    if (!sourceCode || !srcFragment) return null;
    const [begin] = srcFragment.split(':', 1);
    return read(sourceCode).substr(0, begin).split('\n').length
  }

  _tryGetSourceFragment(sourceCode, src) {
    if (!src || !sourceCode) return null;
    const [begin, count] = src.split(':');
    return sourceCode.substr(begin, count);
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
