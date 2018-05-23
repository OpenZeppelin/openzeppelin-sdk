import _ from 'lodash';
import { bytecodeDigest } from '../../utils/digest';
import { Contracts, Logger, FileSystem as fs, App } from 'zos-lib';

const log = new Logger('NetworkController');

export default class NetworkBaseController {
  constructor(localController, network, txParams, networkFileName) {
    this.localController = localController;
    this.txParams = txParams;
    this.network = network;
    this.networkFileName = networkFileName || localController.packageFileName.replace(/\.json\s*$/, `.${network}.json`);
    if (this.networkFileName === localController.packageFileName) {
      throw Error(`Cannot create network file name from ${localController.packageFileName}`)
    }
  }

  get isDeployed() {
    throw Error("Unimplemented function isDeployed()");
  }

  get packageAddress() {
    return this.networkPackage.package && this.networkPackage.package.address;
  }

  get packageData() {
    return this.localController.packageData;
  }

  get networkPackage() {
    if (!this._networkPackage) {
      this._networkPackage = fs.parseJsonIfExists(this.networkFileName) || _.cloneDeep(this.defaultNetworkPackage);
    }
    return this._networkPackage;
  }

  get defaultNetworkPackage() {
    return { contracts: {} };
  }

  writeNetworkPackage() {
    fs.writeJson(this.networkFileName, this.networkPackage);
    log.info(`Successfully written ${this.networkFileName}`)
  }

  async init() {
    return await (this.isDeployed() ? this.fetch() : this.deploy());
  }

  async push(reupload = false) {
    await this.init()
    await this.pushVersion()
    await this.uploadContracts(reupload)
  }

  async pushVersion() {
    const requestedVersion = this.packageData.version;
    const currentVersion = this.networkPackage.version;
    if (requestedVersion !== currentVersion) {
      log.info(`Creating new version ${requestedVersion}`);
      const provider = await this.newVersion(requestedVersion);
      this.networkPackage.contracts = {};
      this.networkPackage.provider = { address: provider.address };
    }
    this.networkPackage.version = requestedVersion;
  }

  async uploadContracts(reupload) {
    const failures = []
    await Promise.all(
      _(this.packageData.contracts)
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
    this.networkPackage.contracts[contractAlias] = {
      address: contractInstance.address,
      bytecodeHash: bytecodeDigest(contractClass.bytecode)
    };
  }

  checkLocalContractsDeployed(throwIfFail = false) {
    const contracts = _.keys(this.packageData.contracts);
    let msg;
    
    const [contractsDeployed, contractsMissing] = _.partition(contracts, (alias) => this.isContractDeployed(alias));
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
    const contractName = this.packageData.contracts[contractAlias];
    if (!this.isApplicationContract(contractAlias)) return false;
    if (!this.isContractDeployed(contractAlias)) return true;
    const contractClass = Contracts.getFromLocal(contractName);
    const currentBytecode = bytecodeDigest(contractClass.bytecode);
    const deployedBytecode = this.networkPackage.contracts[contractAlias].bytecodeHash;
    return currentBytecode !== deployedBytecode;
  }

  isApplicationContract(contractAlias) {
    return !!this.packageData.contracts[contractAlias];
  }

  isContractDefined(contractAlias) {
    return this.isApplicationContract(contractAlias);
  }

  isContractDeployed(contractAlias) {
    return !this.isApplicationContract(contractAlias) || !_.isEmpty(this.networkPackage.contracts[contractAlias]);
  }

  isLib() {
    return this.localController.isLib();
  }
}
