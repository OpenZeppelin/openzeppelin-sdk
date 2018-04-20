import _ from 'lodash';
import Stdlib from './Stdlib';
import makeContract from '../utils/contract';
import decodeLogs from 'zos-lib/test/helpers/decodeLogs';
import encodeCall from 'zos-lib/test/helpers/encodeCall';
import fs from 'fs';

const AppManager = makeContract('PackagedAppManager');
const AppDirectory = makeContract('AppDirectory');
const Package = makeContract('Package');
const UpgradeabilityProxyFactory = makeContract('UpgradeabilityProxyFactory');

class AppManagerWrapper {

  constructor(owner, network) {
    this.owner = owner;
    this.network = network;
    this.directories = {};
    this.txParams = { from: this.owner }
  }

  getCurrentDirectory() {
    return this.directories[this.version];
  }

  address() {
    return this.appManager.address;
  }

  async deploy(initialVersion, stdlib) {
    this.factory = await UpgradeabilityProxyFactory.new(this.txParams);
    this.package = await Package.new(this.txParams);
    const stdlibAddress = this._getStdlibAddress(stdlib);
    const directory = await AppDirectory.new(stdlibAddress, this.txParams);
    await this.package.addVersion(initialVersion, directory.address, this.txParams);
    this.directories[initialVersion] = directory;
    this.version = initialVersion;
    this.appManager = await AppManager.new(this.package.address, initialVersion, this.factory.address, this.txParams);
  }

  async connect(address) {
    this.appManager = new AppManager(address);
    this.package = new Package(await this.appManager.package());
    this.factory = new UpgradeabilityProxyFactory(await this.appManager.factory());
    this.version = await this.appManager.version();
    this.directories[this.version] = new AppDirectory(await this.package.getVersion(this.version));
  }

  async newVersion(versionName, stdlib) {
    const stdlibAddress = this._getStdlibAddress(stdlib);
    const directory = await AppDirectory.new(stdlibAddress, this.txParams);
    await this.package.addVersion(versionName, directory.address, this.txParams);
    await this.appManager.setVersion(versionName, this.txParams);
    this.directories[versionName] = directory;
    this.version = versionName;
  }

  async getImplementation(contractName) {
    const directory = this.getCurrentDirectory();
    return directory.getImplementation(contractName)
  }

  async setImplementation(contractClass, contractName) {
    const implementation = await contractClass.new(this.txParams);
    const directory = this.getCurrentDirectory();
    await directory.setImplementation(contractName, implementation.address, this.txParams);
    return implementation;
  }

  async setStdlib(stdlib) {
    const stdlibAddress = this._getStdlibAddress(stdlib);
    await this.getCurrentDirectory().setStdlib(stdlibAddress, { from: this.owner });
    return stdlibAddress;
  }

  async createProxy(contractClass, contractName, initMethodName, initArgs) {
    const { receipt } = typeof(initArgs) === 'undefined'
      ? await this._createProxy(contractName)
      : await this._createProxyAndCall(contractClass, contractName, initMethodName, initArgs);

    const logs = decodeLogs([receipt.logs[0]], UpgradeabilityProxyFactory, 0x0);
    const address = logs.find(l => l.event === 'ProxyCreated').args.proxy;
    return new contractClass(address);
  }

  async upgradeProxy(proxyAddress, contractClass, contractName, initMethodName, initArgs) {
    if(typeof(initArgs) === 'undefined') return this.appManager.upgradeTo(proxyAddress, contractName, this.txParams);
    const initMethod = this._validateInitMethod(contractClass, initMethodName, initArgs)
    const initArgTypes = initMethod.inputs.map(input => input.type);
    const callData = encodeCall(initMethodName, initArgTypes, initArgs);
    return this.appManager.upgradeToAndCall(proxyAddress, contractName, callData, this.txParams);
  }

  async _createProxy(contractName) {
    return this.appManager.create(contractName, this.txParams);
  }

  async _createProxyAndCall(contractClass, contractName, initMethodName, initArgs) {
    const initMethod = this._validateInitMethod(contractClass, initMethodName, initArgs);
    const initArgTypes = initMethod.inputs.map(input => input.type);
    const callData = encodeCall(initMethodName, initArgTypes, initArgs);
    return this.appManager.createAndCall(contractName, callData, this.txParams);
  }

  _validateInitMethod(contractClass, initMethodName, initArgs) {
    const initMethod = contractClass.abi.find(fn => fn.name === initMethodName && fn.inputs.length === initArgs.length);
    if (!initMethod) throw `Could not find initialize method '${initMethodName}' with ${initArgs.length} arguments in contract class`;
    return initMethod;
  }

  _getStdlibAddress(stdlib) {
    if (!stdlib || _.isEmpty(stdlib)) return 0;
    else if (typeof(stdlib) === 'string' && stdlib.startsWith('0x')) return stdlib;
    else if (stdlib.getDeployed) return stdlib.getDeployed(this.network);
    else return (new Stdlib(stdlib)).getDeployed(this.network);
  }

  // TODO: This code is in part duplicated from scripts/sync.js and ./Stdlib.js
  // It also depends on packageData structure, unlike the rest of the methods in this class
  // Consider moving it elsewhere
  async deployAll(maybePackageData) {
    // Deploy app manager
    const packageData = maybePackageData || JSON.parse(fs.readFileSync('package.zos.json'));
    await this.deploy(packageData.version);

    // Deploy and set stdlib
    if (!_.isEmpty(packageData.stdlib)) {
      const stdlib = new Stdlib(packageData.stdlib, this.owner);
      const directory = await stdlib.deploy();
      await this.getCurrentDirectory().setStdlib(directory.address, { from: this.owner });
    }

    // Deploy all contracts
    const directory = this.getCurrentDirectory()
    await Promise.all(_.map(packageData.contracts, async (contractImpl, contractAlias) => {
      const contractClass = await makeContract.local(contractImpl);
      const deployed = await contractClass.new({ from: this.owner });
      await directory.setImplementation(contractAlias, deployed.address, { from: this.owner });
    }));
  }
}

export default AppManagerWrapper;
