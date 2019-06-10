import { Contracts, Contract, FileSystem } from 'zos-lib';
import Dependency from '../dependency/Dependency';
import ZosPackageFile from '../files/ZosPackageFile';
import ConfigManager from '../config/ConfigManager';
import path from 'path';

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

  public getContractNames(root: string = this.packageFile.root): string[] {
    const buildDir = ConfigManager.getBuildDir();
    const contractsDir = Contracts.getLocalContractsDir();
    if (FileSystem.exists(buildDir)) {
      return FileSystem.readDir(buildDir)
        .filter(name => name.match(/\.json$/))
        .map(name => FileSystem.parseJsonIfExists(`${buildDir}/${name}`))
        .filter(contract => {
          return (
            this.isLocalContract(contractsDir, contract, root) &&
            !this.isLibrary(contract) &&
            !this.isAbstractContract(contract)
          );
        })
        .map(({ contractName }) => contractName);
    } else return [];
  }

  private isLocalContract(
    contractsDir: string,
    contract: { sourcePath: string },
    root: string,
  ): boolean {
    const cwd = root || process.cwd();
    const contractFullPath = path.resolve(cwd, contract.sourcePath);
    return contractFullPath.indexOf(contractsDir) === 0;
  }

  private isAbstractContract(contract: { [key: string]: any }): boolean {
    return contract && contract.bytecode.length <= 2;
  }

  private isLibrary(contract: { [key: string]: any }): boolean {
    return (
      contract &&
      contract.ast &&
      !!contract.ast.nodes.find(
        node =>
          node.contractKind === 'library' &&
          node.name === contract.contractName,
      )
    );
  }
}
