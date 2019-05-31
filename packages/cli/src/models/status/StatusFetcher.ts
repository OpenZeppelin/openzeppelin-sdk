import {
  ZWeb3,
  Contracts,
  Logger,
  FileSystem as fs,
  bytecodeDigest,
  bodyCode,
  constructorCode,
} from 'zos-lib';
import ZosNetworkFile from '../files/ZosNetworkFile';
import { ComparedObject } from './StatusComparator';

const log = new Logger('StatusFetcher');

export default class StatusFetcher {
  public networkFile: ZosNetworkFile;

  public constructor(networkFile) {
    this.networkFile = networkFile;
  }

  public onEndChecking(): void {
    log.info('Your project is up to date.');
  }

  public onMismatchingVersion(expected: string, observed: string): void {
    log.info(`Updating version from ${expected} to ${observed}`);
    this.networkFile.version = observed;
  }

  public onMismatchingPackage(expected: string, observed: string): void {
    log.info(`Updating package from ${expected} to ${observed}`);
    this.networkFile.package = { address: observed };
  }

  public onMismatchingProvider(expected: string, observed: string): void {
    log.info(`Updating provider from ${expected} to ${observed}`);
    this.networkFile.provider = { address: observed };
  }

  public onUnregisteredLocalImplementation(
    expected: string,
    observed: string,
    { alias, address }: ComparedObject,
  ): void {
    log.info(`Removing unregistered local contract ${alias} ${address}`);
    this.networkFile.unsetContract(alias);
  }

  public async onMissingRemoteImplementation(
    expected: string,
    observed: string,
    { alias, address }: ComparedObject,
  ): Promise<void> {
    const contractName = this.networkFile.packageFile.contract(alias) || alias;
    log.info(`Adding contract ${contractName} at ${address}`);
    const buildPath = Contracts.getLocalPath(contractName);
    if (fs.exists(buildPath)) {
      const contract = Contracts.getFromLocal(contractName);
      const instance = contract.at(address);
      const remoteBodyBytecode = (await ZWeb3.getCode(address)).replace(
        /^0x/,
        '',
      );
      const bodyBytecodeHash = bytecodeDigest(remoteBodyBytecode);
      if (bodyCode(contract) === remoteBodyBytecode) {
        log.warn(
          `Assuming that constructor function of local version of ${contractName} is the one registered`,
        );
        const constructor = constructorCode(contract);
        const bytecodeHash = bytecodeDigest(
          `${constructor}${remoteBodyBytecode}`,
        );
        this.networkFile.setContract(alias, {
          address,
          localBytecodeHash: bytecodeHash,
          deployedBytecodeHash: bytecodeHash,
          bodyBytecodeHash,
          constructorCode: constructor,
        });
      } else {
        log.error(
          `Local version of ${contractName} has a different bytecode than the one stored at ${address}`,
        );
        this.networkFile.setContract(alias, {
          address,
          bodyBytecodeHash,
          localBytecodeHash: 'unknown',
          deployedBytecodeHash: 'unknown',
          constructorCode: 'unknown',
        });
      }
    } else {
      log.error(`Cannot find a contract build file for ${contractName}`);
      this.networkFile.setContract(alias, {
        address,
        localBytecodeHash: 'unknown',
        deployedBytecodeHash: 'unknown',
        constructorCode: 'unknown',
      });
    }
  }

  public onMismatchingImplementationAddress(
    expected: string,
    observed: string,
    { alias, address }: ComparedObject,
  ): void {
    log.info(
      `Updating address of contract ${alias} from ${expected} to ${observed}`,
    );
    this.networkFile.updateImplementation(alias, implementation => ({
      ...implementation,
      address,
    }));
  }

  public onMismatchingImplementationBodyBytecode(
    expected: string,
    observed: string,
    { alias, address, bodyBytecodeHash }: ComparedObject,
  ): void {
    log.info(
      `Updating bytecodeHash of contract ${alias} from ${expected} to ${observed}`,
    );
    this.networkFile.updateImplementation(alias, implementation => ({
      ...implementation,
      bodyBytecodeHash,
    }));
  }

  public onUnregisteredLocalProxy(
    expected: string,
    observed: string,
    { packageName, alias, address, implementation }: ComparedObject,
  ): void {
    log.info(
      `Removing unregistered local proxy of ${alias} at ${address} pointing to ${implementation}`,
    );
    this.networkFile.removeProxy(packageName, alias, address);
  }

  public onMissingRemoteProxy(
    expected: string,
    observed: string,
    { packageName, alias, address, implementation }: ComparedObject,
  ): void {
    log.info(
      `Adding missing proxy of ${alias} at ${address} pointing to ${implementation}`,
    );
    this.networkFile.addProxy(packageName, alias, {
      address,
      version: 'unknown',
      implementation,
    });
  }

  public onMismatchingProxyAlias(
    expected: string,
    observed: string,
    { packageName, address, version, implementation }: ComparedObject,
  ): void {
    log.info(
      `Changing alias of package ${packageName} proxy at ${address} pointing to ${implementation} from ${expected} to ${observed}`,
    );
    this.networkFile.removeProxy(packageName, expected, address);
    this.networkFile.addProxy(packageName, observed, {
      address,
      version,
      implementation,
    });
  }

  public onMismatchingProxyImplementation(
    expected: string,
    observed: string,
    { packageName, address, version, implementation, alias }: ComparedObject,
  ): void {
    log.info(
      `Changing implementation of proxy ${alias} at ${address} from ${expected} to ${observed}`,
    );
    this.networkFile.updateProxy(
      { package: packageName, contract: alias, address },
      proxy => ({ ...proxy, implementation: observed }),
    );
  }

  public onUnregisteredProxyImplementation(
    expected: string,
    observed: string,
    { address, implementation }: ComparedObject,
  ): void {
    log.error(
      `Proxy at ${address} is pointing to ${implementation}, but given implementation is not registered in project`,
    );
  }

  public onMultipleProxyImplementations(
    expected: string,
    observed: string,
    { implementation }: ComparedObject,
  ): void {
    log.warn(
      `The same implementation address ${implementation} was registered under many aliases (${observed}). Please check them in the list of registered contracts.`,
    );
  }

  public onMissingDependency(
    expected: string,
    observed: string,
    { name, address, version }: ComparedObject,
  ): void {
    log.info(
      `Adding missing dependency ${name} at ${address} with version ${version}`,
    );
    this.networkFile.setDependency(name, { package: address, version });
  }

  public onMismatchingDependencyAddress(
    expected: string,
    observed: string,
    { name, address }: ComparedObject,
  ): void {
    log.info(
      `Changing dependency ${name} package address from ${expected} to ${observed}`,
    );
    this.networkFile.updateDependency(name, dependency => ({
      ...dependency,
      package: observed,
    }));
  }

  public onMismatchingDependencyVersion(
    expected: string,
    observed: string,
    { name, version }: ComparedObject,
  ): void {
    log.info(
      `Changing dependency ${name} version from ${expected} to ${observed}`,
    );
    this.networkFile.updateDependency(name, dependency => ({
      ...dependency,
      version: observed,
    }));
  }

  public onUnregisteredDependency(
    expected: string,
    observed: string,
    { name, package: packageAddress }: ComparedObject,
  ): void {
    log.info(
      `Removing unregistered local dependency of ${name} at ${packageAddress}`,
    );
    this.networkFile.unsetDependency(name);
  }
}
