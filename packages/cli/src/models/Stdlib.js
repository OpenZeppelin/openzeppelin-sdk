import truffleContract from 'truffle-contract';
import fs from 'fs';
import path from 'path';

const ContractDirectory = artifacts.require('ContractDirectory');

export default class Stdlib {
  constructor(name, owner) {
    this.name = name;
    this.owner = owner;
    this.package = JSON.parse(fs.readFileSync(`node_modules/${this.name}/package.zos.json`));
  }

  async getContract(contractName) {
    const implName = this.package.contracts[contractName];
    if (!implName) throw `Contract ${contractName} not found in package`;
    const schema = JSON.parse(fs.readFileSync(`node_modules/${this.name}/build/contracts/${implName}.json`));
    const contract = truffleContract(schema);
    contract.setProvider(web3.currentProvider);
    contract.defaults(ContractDirectory.class_defaults);
    return contract;
  }

  listContracts() {
    return Object.keys(this.package.contracts);
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
    const networkInfo = JSON.parse(fs.readFileSync(`node_modules/${this.name}/package.zos.${network}.json`))
    return  networkInfo.app.address;
  }
}