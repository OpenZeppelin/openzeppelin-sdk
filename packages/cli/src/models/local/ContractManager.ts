import { Contracts, Contract, FileSystem } from 'zos-lib';
import Dependency from '../dependency/Dependency';
import ZosPackageFile from '../files/ZosPackageFile';
import ConfigManager from '../config/ConfigManager';

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

  public getContractNames(): string[] {
    const buildDir = ConfigManager.getBuildDir();
    if (FileSystem.exists(buildDir)) {
      return FileSystem.readDir(buildDir)
        .filter(name => name.match(/\.json$/))
        .map(name => FileSystem.parseJsonIfExists(`${buildDir}/${name}`))
        .filter(contract => {
          return (
            this.isLocalContract(buildDir, contract) &&
            !this.isLibrary(contract) &&
            !this.isAbstractContract(contract)
          );
        })
        .map(({ contractName }) => contractName);
    } else return [];
  }

  private isLocalContract(
    buildDir: string,
    contract: { [key: string]: any },
  ): boolean {
    const projectDir = buildDir.replace('build/contracts', '');
    return contract.sourcePath.indexOf(projectDir) === 0;
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
