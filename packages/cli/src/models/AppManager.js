import decodeLogs from '../utils/decodeLogs';
import encodeCall from '../utils/encodeCall';
import Stdlib from './Stdlib';
import _ from 'lodash';

const AppManager = artifacts.require('PackagedAppManager');
const AppDirectory = artifacts.require('AppDirectory');
const Package = artifacts.require('Package');
const UpgradeabilityProxyFactory = artifacts.require('UpgradeabilityProxyFactory');

class AppManagerWrapper {

  constructor(owner, network) {
    this.owner = owner;
    this.network = network;
    this.directories = {};
  }

  getCurrentDirectory() {
    return this.directories[this.version];
  }

  address() {
    return this.appManager.address;
  }

  async deploy(initialVersion, stdlib) {
    this.factory = await UpgradeabilityProxyFactory.new({ from: this.owner });
    this.package = await Package.new({ from: this.owner });
    const stdlibAddress = this._getStdlibAddress(stdlib);
    const directory = await AppDirectory.new(stdlibAddress, { from: this.owner });
    await this.package.addVersion(initialVersion, directory.address, { from: this.owner });
    this.directories[initialVersion] = directory;
    this.version = initialVersion;
    this.appManager = await AppManager.new(this.package.address, initialVersion, this.factory.address, { from: this.owner });
  }

  _getStdlibAddress(stdlib) {
    if (!stdlib || _.isEmpty(stdlib)) {
      return 0;
    } else if (stdlib.getDeployed) {
      return stdlib.getDeployed(this.network);
    } else {
      return (new Stdlib(stdlib)).getDeployed(this.network);
    }
  }

  async connect(address) {
    this.appManager = await AppManager.at(address);
    this.package = Package.at(await this.appManager.package());
    this.factory = UpgradeabilityProxyFactory.at(await this.appManager.factory());
    this.version = await this.appManager.version();
    this.directories[this.version] = AppDirectory.at(await this.package.getVersion(this.version));
  }

  async newVersion(versionName, stdlib) {
    const stdlibAddress = this._getStdlibAddress(stdlib);
    const directory = await AppDirectory.new(stdlibAddress, { from: this.owner });
    await this.package.addVersion(versionName, directory.address, { from: this.owner });
    await this.appManager.setVersion(versionName, { from: this.owner });
    this.directories[versionName] = directory;
    this.version = versionName;
  }

  async getImplementation(contractName) {
    const directory = this.getCurrentDirectory();
    return directory.getImplementation(contractName)
  }

  async setImplementation(contractClass, contractName) {
    const implementation = await contractClass.new({ from: this.owner });
    const directory = this.getCurrentDirectory();
    await directory.setImplementation(contractName, implementation.address, { from: this.owner });
    return implementation;
  }

  async setStdlib(stdlib) {
    const stdlibAddress = this._getStdlibAddress(stdlib);
    await this.getCurrentDirectory().setStdlib(stdlibAddress, { from: this.owner });
    return stdlibAddress;
  }

  async createProxy(contractClass, contractName, initArgs) {
    const initMethodName = 'initialize';
    const { receipt } = typeof(initArgs) === 'undefined'
      ? await this._createProxy(contractClass, contractName)
      : await this._createProxyAndCall(contractClass, contractName, initMethodName, initArgs);

    const logs = decodeLogs([receipt.logs[0]], UpgradeabilityProxyFactory, 0x0);
    const address = logs.find(l => l.event === 'ProxyCreated').args.proxy;
    return contractClass.at(address);
  }

  async _createProxyAndCall(contractClass, contractName, initMethodName, initArgs) {
    // TODO: Support more than one initialize function with different arg types
    const initMethod = contractClass.abi.find(fn => fn.name === initMethodName && fn.inputs.length === initArgs.length);
    if (!initMethod) throw `Could not find initialize method '${initMethodName}' with ${initArgs.length} arguments in contract class`;
    
    const initArgTypes = initMethod.inputs.map(input => input.type);
    const initData = encodeCall('initialize', initArgTypes, initArgs);
    return this.appManager.createAndCall(contractName, initData, { from: this.owner });
  }

  async _createProxy(contractClass, contractName) {
    return this.appManager.create(contractName, { from: this.owner });
  }

  // TODO: Instead of accepting argTypes, could accept contractClass and lookup the types in its ABI. Decide which option is most usable.
  async upgradeProxy(proxyAddress, contractName, methodName, argTypes, args) {
    if (typeof(methodName) === 'undefined') {
      return this.appManager.upgradeTo(proxyAddress, contractName, { from: this.owner });
    } else {
      const callData = encodeCall(methodName, argTypes, args);
      return this.appManager.upgradeToAndCall(proxyAddress, contractName, callData, { from: this.owner });  
    }
  }
}

export default AppManagerWrapper;
