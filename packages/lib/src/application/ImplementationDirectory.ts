import { Loggy } from '../utils/Logger';
import Transactions from '../utils/Transactions';
import Contracts from '../artifacts/Contracts';
import Contract from '../artifacts/Contract';
import { TxParams } from '../artifacts/ZWeb3';

// TS-TODO: review which members could be private
export default class ImplementationDirectory {
  public directoryContract: Contract;
  public txParams: TxParams;

  public static async deploy(txParams: TxParams = {}): Promise<ImplementationDirectory> {
    const contract = this.getContract();
    const directory = await Transactions.deployContract(contract, [], txParams);
    Loggy.onVerbose(
      __filename,
      'deploy',
      `deployed-implementation-directory`,
      `Deployed ${contract.schema.contractName} at ${directory.address}`,
    );

    return new this(directory, txParams);
  }

  public static fetch(address: string, txParams: TxParams = {}): ImplementationDirectory {
    const contract = this.getContract();
    const directory = contract.at(address);
    return new this(directory, txParams);
  }

  public static getContract(): Contract {
    return Contracts.getFromLib('ImplementationDirectory');
  }

  public constructor(directory: Contract, txParams: TxParams = {}) {
    this.directoryContract = directory;
    this.txParams = txParams;
  }

  public get contract(): Contract {
    return this.directoryContract;
  }

  public get address(): string {
    return this.directoryContract.address;
  }

  public async owner(): Promise<string> {
    return this.directoryContract.methods.owner().call({ ...this.txParams });
  }

  public async getImplementation(contractName: string): Promise<string | never> {
    if (!contractName) throw Error('Contract name is required to retrieve an implementation');
    return await this.directoryContract.methods.getImplementation(contractName).call({ ...this.txParams });
  }

  public async setImplementation(contractName: string, implementationAddress: string): Promise<any> {
    Loggy.onVerbose(
      __filename,
      'setImplementation',
      `set-implementation-${contractName}`,
      `Setting ${contractName} implementation ${implementationAddress} in directory`,
    );
    await Transactions.sendTransaction(
      this.directoryContract.methods.setImplementation,
      [contractName, implementationAddress],
      { ...this.txParams },
    );
    Loggy.succeed(`set-implementation-${contractName}`, `Setting ${contractName} in directory`);
  }

  public async unsetImplementation(contractName: string): Promise<any> {
    Loggy.onVerbose(
      __filename,
      'unsetImplementation',
      `unset-implementation-${contractName}`,
      `Unsetting ${contractName} implementation`,
    );
    await Transactions.sendTransaction(this.directoryContract.methods.unsetImplementation, [contractName], {
      ...this.txParams,
    });
    Loggy.succeed(`unset-implementation-${contractName}`, `${contractName} implementation unset`);
  }

  public async freeze(): Promise<any> {
    Loggy.spin(__filename, 'freeze', `freeze-implementation`, 'Freezing directory version');
    await Transactions.sendTransaction(this.directoryContract.methods.freeze, [], { ...this.txParams });
    Loggy.succeed(`freeze-implementation`, `Directory version frozen`);
  }

  public async isFrozen(): Promise<boolean> {
    return await this.directoryContract.methods.frozen().call();
  }
}
