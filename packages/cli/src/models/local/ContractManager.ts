import { Contracts, Contract } from 'zos-lib';
import Dependency from '../dependency/Dependency';
import ZosPackageFile from '../files/ZosPackageFile';

export default class ContractManager {
  public packageFile: ZosPackageFile;

  public constructor(packageFile: ZosPackageFile = new ZosPackageFile()) {
    this.packageFile = packageFile;
  }

  public getContractClass(
    packageName: string,
    contractAlias: string,
  ): Contract {
    if (!packageName || packageName === this.packageFile.name) {
      const contractName = this.packageFile.contract(contractAlias);
      return Contracts.getFromLocal(contractName);
    } else {
      const dependency = new Dependency(packageName);
      const contractName = dependency.getPackageFile().contract(contractAlias);
      return Contracts.getFromNodeModules(packageName, contractName);
    }
  }

  public hasContract(packageName: string, contractAlias: string): boolean {
    if (!packageName || packageName === this.packageFile.name) {
      return !!this.packageFile.contract(contractAlias);
    } else {
      const dependency = new Dependency(packageName);
      return !!dependency.getPackageFile().contract(contractAlias);
    }
  }
}
