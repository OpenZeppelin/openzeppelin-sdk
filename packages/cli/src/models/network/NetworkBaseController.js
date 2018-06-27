import _ from 'lodash';
import { Contracts, Logger, App } from 'zos-lib';
import StatusComparator from '../status/StatusComparator'

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
    const statusComparator = new StatusComparator(this.networkFile, this.txParams)
    await statusComparator.call()
  }

  async createProxy() {
    throw Error('Unimplemented function createProxy()')
  }

  async push(reupload = false) {
    await this.init()
    await this.pushVersion()
    await this.uploadContracts(reupload)
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
      const message = failures.map(failure => `${failure.contractAlias} deployment failed with ${failure.error.message}`).join('\n')
      throw Error(message)
    }
  }

  async uploadContract(contractAlias, contractName) {
    const contractClass = Contracts.getFromLocal(contractName);
    log.info(`Uploading ${contractName} contract as ${contractAlias}`);
    const contractInstance = await this.setImplementation(contractClass, contractAlias);
    this.networkFile.setContract(contractAlias, contractInstance)
  }

  checkLocalContractsDeployed(throwIfFail = false) {
    let msg;
    const [contractsDeployed, contractsMissing] = _.partition(this.packageFile.contractAliases, (alias) => this.isContractDeployed(alias));
    const contractsChanged = _.filter(contractsDeployed, (alias) => this.hasContractChanged(alias));

    if (!_.isEmpty(contractsMissing)) {
      msg = `Contracts ${contractsMissing.join(', ')} are not deployed.`;
    } else if (!_.isEmpty(contractsChanged)) {
      msg = `Contracts ${contractsChanged.join(', ')} have changed since the last deploy.`;
    }

    if (msg && throwIfFail) throw Error(msg);
    else if (msg) log.info(msg);    
  }

  checkLocalContractDeployed(contractAlias, throwIfFail = false) {
    let msg;
    if (!this.isContractDefined(contractAlias)) {
      msg = `Contract ${contractAlias} not found in application or stdlib`;
    } else if (!this.isContractDeployed(contractAlias)) {
      msg = `Contract ${contractAlias} is not deployed to ${this.network}.`;
    } else if (this.hasContractChanged(contractAlias)) {
      msg = `Contract ${contractAlias} has changed locally since the last deploy, consider running 'zos push'.`;
    }

    if (msg && throwIfFail) throw Error(msg);
    else if (msg) log.info(msg);
  }

  hasContractChanged(contractAlias) {
    if (!this.packageFile.hasContract(contractAlias)) return false;
    if (!this.isContractDeployed(contractAlias)) return true;
    const contractName = this.packageFile.contract(contractAlias);
    const contractClass = Contracts.getFromLocal(contractName);
    return !this.networkFile.hasSameBytecode(contractAlias, contractClass)
  }

  isContractDefined(contractAlias) {
    return this.packageFile.hasContract(contractAlias)
  }

  isContractDeployed(contractAlias) {
    return !this.packageFile.hasContract(contractAlias) || this.networkFile.hasContract(contractAlias);
  }

  writeNetworkPackage() {
    this.networkFile.write()
  }
}
