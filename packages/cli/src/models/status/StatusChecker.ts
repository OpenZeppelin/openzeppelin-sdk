import EventsFilter from './EventsFilter';
import StatusFetcher from './StatusFetcher';
import StatusComparator from './StatusComparator';
import {
  ZWeb3,
  TxParams,
  Logger,
  AppProject,
  bytecodeDigest,
  semanticVersionToString,
  semanticVersionEqual,
  replaceSolidityLibAddress,
  isSolidityLib,
} from 'zos-lib';
import ZosNetworkFile, { DependencyInterface } from '../files/ZosNetworkFile';
import { ComparedObject } from './StatusComparator';

const log = new Logger('StatusChecker');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export default class StatusChecker {
  public visitor: any;
  public txParams: TxParams;
  public networkFile: any;
  public packageName: any;

  private project: AppProject;

  public static fetch(
    networkFile: ZosNetworkFile,
    txParams: TxParams = {},
  ): StatusChecker {
    const fetcher = new StatusFetcher(networkFile);
    return new this(fetcher, networkFile, txParams);
  }

  public static compare(
    networkFile: ZosNetworkFile,
    txParams: TxParams = {},
  ): StatusChecker {
    const comparator = new StatusComparator();
    return new this(comparator, networkFile, txParams);
  }

  public constructor(
    visitor: any,
    networkFile: ZosNetworkFile,
    txParams: TxParams = {},
  ) {
    this.visitor = visitor;
    this.txParams = txParams;
    this.networkFile = networkFile;
    this.packageName = this.networkFile.packageFile.name;
  }

  public async setProject(): Promise<any | never> {
    try {
      const { packageAddress, appAddress, version } = this.networkFile;

      if (!this.project) {
        this.project = await AppProject.fetchOrDeploy(
          this.packageName,
          this.networkFile.version,
          this.txParams,
          { appAddress, packageAddress },
        );
      }

      return this.project;
    } catch (error) {
      error.message = `Cannot fetch project contract from address ${
        this.networkFile.appAddress
      }: ${error.message}`;
      throw error;
    }
  }

  public async call(): Promise<void> {
    await this.setProject();
    log.info(
      `Comparing status of project ${
        (await this.project.getProjectPackage()).address
      } ...\n`,
    );
    await this.checkApp();
    this.visitor.onEndChecking();
  }

  public async checkApp(): Promise<void> {
    await this.checkVersion();
    await this.checkPackage();
    await this.checkProvider();
    await this.checkImplementations();
    await this.checkDependencies();
  }

  public async checkVersion(): Promise<void> {
    const observed = this.project.version;
    const expected = this.networkFile.version;
    if (!semanticVersionEqual(observed, expected))
      this.visitor.onMismatchingVersion(expected, observed);
  }

  public async checkPackage(): Promise<void> {
    const observed = this.project.package.address;
    const expected = this.networkFile.packageAddress;
    if (observed !== expected)
      this.visitor.onMismatchingPackage(expected, observed);
  }

  public async checkProvider(): Promise<void> {
    const currentDirectory = await this.project.getCurrentDirectory();
    const observed = currentDirectory.address;
    const expected = this.networkFile.providerAddress;
    if (observed !== expected)
      this.visitor.onMismatchingProvider(expected, observed);
  }

  public async checkDependencies(): Promise<void> {
    const dependenciesInfo = await this._fetchOnChainPackages();
    dependenciesInfo.forEach(info => this._checkRemoteDependency(info));
    this._checkUnregisteredLocalDependencies(dependenciesInfo);
  }

  public async checkImplementations(): Promise<boolean | void> {
    const implementationsInfo = await this._fetchOnChainImplementations();
    await Promise.all(
      implementationsInfo.map(async info => {
        const { address } = info;
        const bytecode = await ZWeb3.getCode(address);
        return await (isSolidityLib(bytecode)
          ? this._checkRemoteSolidityLibImplementation(info, bytecode)
          : this._checkRemoteContractImplementation(info, bytecode));
      }),
    );
    this._checkUnregisteredLocalImplementations(implementationsInfo);
  }

  private async _checkRemoteContractImplementation(
    { alias, address }: ComparedObject,
    bytecode: string,
  ): Promise<void> {
    if (this.networkFile.hasContract(alias)) {
      this._checkContractImplementationAddress(alias, address);
      this._checkContractImplementationBytecode(alias, address, bytecode);
    } else {
      await this.visitor.onMissingRemoteImplementation('none', 'one', {
        alias,
        address,
      });
    }
  }

  private _checkContractImplementationAddress(
    alias: string,
    address: string,
  ): void {
    const expected = this.networkFile.contract(alias).address;
    if (address !== expected)
      this.visitor.onMismatchingImplementationAddress(expected, address, {
        alias,
        address,
      });
  }

  private _checkContractImplementationBytecode(
    alias: string,
    address: string,
    bytecode: string,
  ): void {
    const expected = this.networkFile.contract(alias).bodyBytecodeHash;
    const observed = bytecodeDigest(bytecode);
    if (observed !== expected)
      this.visitor.onMismatchingImplementationBodyBytecode(expected, observed, {
        alias,
        address,
        bodyBytecodeHash: observed,
      });
  }

  private async _checkRemoteSolidityLibImplementation(
    { alias, address }: ComparedObject,
    bytecode: string,
  ): Promise<void> {
    if (this.networkFile.hasSolidityLib(alias)) {
      this._checkSolidityLibImplementationAddress(alias, address);
      this._checkSolidityLibImplementationBytecode(alias, address, bytecode);
    }
    // TODO: implement missing remote solidity libs validation
    // else this.visitor.onMissingRemoteImplementation('none', 'one', { alias, address })
  }

  private _checkSolidityLibImplementationAddress(
    alias: string,
    address: string,
  ): void {
    const expected = this.networkFile.solidityLib(alias).address;
    if (address !== expected)
      this.visitor.onMismatchingImplementationAddress(expected, address, {
        alias,
        address,
      });
  }

  private _checkSolidityLibImplementationBytecode(
    alias: string,
    address: string,
    bytecode: string,
  ): void {
    const expected = this.networkFile.solidityLib(alias).bodyBytecodeHash;
    const observed = bytecodeDigest(
      replaceSolidityLibAddress(bytecode, address),
    );
    if (observed !== expected)
      this.visitor.onMismatchingImplementationBodyBytecode(expected, observed, {
        alias,
        address,
        bodyBytecodeHash: observed,
      });
  }

  private _checkUnregisteredLocalImplementations(
    implementationsInfo: any[],
  ): void {
    const foundAliases = implementationsInfo.map((info: any) => info.alias);
    this.networkFile.contractAliases
      .filter(alias => !foundAliases.includes(alias))
      .forEach(alias => {
        const { address } = this.networkFile.contract(alias);
        this.visitor.onUnregisteredLocalImplementation('one', 'none', {
          alias,
          address,
        });
      });
  }

  private _checkRemoteDependency({
    name,
    version,
    package: address,
  }: ComparedObject): void {
    if (this.networkFile.hasDependency(name)) {
      this._checkDependencyAddress(name, address);
      this._checkDependencyVersion(name, version);
    } else
      this.visitor.onMissingDependency('none', 'one', {
        name,
        address,
        version,
      });
  }

  private _checkDependencyAddress(name: string, address: string): void {
    const expected = this.networkFile.getDependency(name).package;
    if (address !== expected)
      this.visitor.onMismatchingDependencyAddress(expected, address, {
        name,
        address,
      });
  }

  private _checkDependencyVersion(name: string, version: string): void {
    const expected = this.networkFile.getDependency(name).version;
    if (!semanticVersionEqual(version, expected))
      this.visitor.onMismatchingDependencyVersion(expected, version, {
        name,
        version,
      });
  }

  private _checkUnregisteredLocalDependencies(
    dependenciesInfo: DependencyInterface[],
  ): void {
    const foundDependencies = dependenciesInfo.map(
      dependency => dependency.name,
    );
    this.networkFile.dependenciesNames
      .filter(name => !foundDependencies.includes(name))
      .forEach(name => {
        const dependency = this.networkFile.getDependency(name);
        this.visitor.onUnregisteredDependency('one', 'none', {
          ...dependency,
          name,
        });
      });
  }

  // TS-TODO: type for event?
  private async _fetchOnChainImplementations(): Promise<any> {
    const filter = new EventsFilter();
    const directory = await this.project.getCurrentDirectory();
    const allEvents = await filter.call(
      directory.contract,
      'ImplementationChanged',
    );
    const contractsAlias = allEvents.map(
      event => event.returnValues.contractName,
    );
    const events = allEvents
      .filter(
        (event, index) =>
          contractsAlias.lastIndexOf(event.returnValues.contractName) === index,
      )
      .filter(event => event.returnValues.implementation !== ZERO_ADDRESS)
      .map(event => ({
        alias: event.returnValues.contractName,
        address: event.returnValues.implementation,
      }));

    return events;
  }

  private async _fetchOnChainPackages(): Promise<any[]> {
    const filter = new EventsFilter();
    const app = this.project.getApp();
    const allEvents = await filter.call(app.appContract, 'PackageChanged');
    const filteredEvents = allEvents
      .filter(event => event.returnValues.package !== ZERO_ADDRESS)
      .filter(event => event.returnValues.providerName !== this.packageName)
      .map(event => ({
        name: event.returnValues.providerName,
        version: semanticVersionToString(event.returnValues.version),
        package: event.returnValues.package,
      }))
      .reduce((dependencies, dependency) => {
        dependencies[dependency.name] = dependency;
        return dependencies;
      }, {});

    return Object.values(filteredEvents);
  }
}
