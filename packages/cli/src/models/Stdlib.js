import truffleContract from 'truffle-contract';
import fs from 'fs';
import path from 'path';
import npm from 'npm-programmatic';
import makeContract from '../utils/contract'

const ContractDirectory = makeContract('ContractDirectory');

export default class Stdlib {
  constructor(nameWithVersion, owner) {
    let name, version;
    if (typeof(nameWithVersion) === 'string') {
      [name, version] = nameWithVersion.split('@');
    } else {
      ({ name, version } = nameWithVersion);
    }
    
    this.name = name;
    this.version = version;
    this.owner = owner;
  }

  getPackage() {
    if (!this.package) {
      this.package = JSON.parse(fs.readFileSync(`node_modules/${this.name}/package.zos.json`));
    }
    return this.package;
  }

  async getContract(contractName) {
    const implName = this.getPackage().contracts[contractName];
    if (!implName) throw `Contract ${contractName} not found in package`;
    const schema = JSON.parse(fs.readFileSync(`node_modules/${this.name}/build/contracts/${implName}.json`));
    const contract = makeContract(schema);
    return contract;
  }

  listContracts() {
    return Object.keys(this.getPackage().contracts);
  }

  async deploy() {
    const directory = await ContractDirectory.new({ from: this.owner });
    await Promise.all(this.listContracts().map(async (contractName) => {
      const contract = await this.getContract(contractName);
      const deployed = await contract.new({ from: this.owner });
      await directory.setImplementation(contractName, deployed.address, { from: this.owner });
    }));
    return directory;
  }

  getDeployed(network) {
    if (!network) throw "Must specify network to read stdlib deployment address";
    const networkInfo = JSON.parse(fs.readFileSync(`node_modules/${this.name}/package.zos.${network}.json`));
    return networkInfo.provider.address;
  }

  async installDependency() {
    const stdlibString = this.version
      ? `${this.name}@${this.version}`
      : this.name
    if (process.env.NODE_ENV !== 'test') {
      await npm.install([stdlibString], {
        save: true, cwd: process.cwd()
      })
    }
  }

  getName() {
    return this.name;
  }

  getVersion() {
    if (!this.version) {
      this.version = this.getPackage().version;
    }
    return this.version;
  }
}