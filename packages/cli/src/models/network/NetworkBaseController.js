import _ from 'lodash';
import { Contracts, Logger, App } from 'zos-lib';
import StatusComparator from '../status/StatusComparator'
import StatusChecker from "../status/StatusChecker";

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

  get packageAddress() {
    return this.networkFile.packageAddress
  }

  get isDeployed() {
    throw Error("Unimplemented function isDeployed()");
  }

  get isLib() {
    return this.packageFile.isLib;
  }

  async init() {
    return await (this.isDeployed ? this.fetch() : this.deploy());
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

  async push(reupload = false) {
    await this.init()
    await this.pushVersion()
    await Promise.all([this.uploadContracts(reupload), this.unsetContracts()])
  }

  async pushVersion() {
    const requestedVersion = this.packageFile.version;
    const currentVersion = this.networkFile.version;
    if (requestedVersion !== currentVersion) {
      log.info(`Currennt version ${currentVersion}`);
      log.info(`Creating new version ${requestedVersion}`);
      const provider = await this.newVersion(requestedVersion);
      this.networkFile.contracts = {};
      this.networkFile.provider = { address: provider.address };
    }
    this.networkFile.version = requestedVersion;
  }

  async uploadContracts(reupload) {
    const failures = []
    await Promise.all(
      _(this.packageFile.contracts)
        .toPairs()
        .filter(([contractAlias, contractName]) => reupload || this.hasContractChanged(contractAlias))
        .map(([contractAlias, contractName]) =>
          this.uploadContract(contractAlias, contractName)
            .catch(error => failures.push({ contractAlias, error }))
        )
    );
    if(!_.isEmpty(failures)) {
      const message = failures.map(failure => `${failure.contractAlias} deployment failed with: ${failure.error.message}`).join('\n')
      throw Error(message)
    }
  }

  async uploadContract(contractAlias, contractName) {
    const contractClass = Contracts.getFromLocal(contractName);
    log.info(`Uploading ${contractName} contract as ${contractAlias}`);
    const contractInstance = await this.setImplementation(contractClass, contractAlias);
    this.networkFile.addContract(contractAlias, contractInstance)
  }

  async unsetContracts() {
    const failures = [];
    await Promise.all(
      this.networkFile.contractAliasesMissingFromPackage().map(contractAlias =>
        this.unsetContract(contractAlias)
          .catch(error => failures.push({ contractAlias, error }))
      )
    );
    if(!_.isEmpty(failures)) {
      const message = failures.map(failure => `Removal of ${failure.contractAlias} failed with: ${failure.error.message}`).join('\n')
      throw Error(message)
    }
  }

  async unsetContract(contractAlias) {
    log.info(`Removing ${contractAlias} contract`);
    await this.unsetImplementation(contractAlias);
    this.networkFile.unsetContract(contractAlias)
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

  writeNetworkPackage() {
    this.networkFile.write()
  }
}
