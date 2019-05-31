import { Logger } from 'zos-lib';
import StatusReport from './StatusReport';

const log = new Logger('StatusComparator');

export interface ComparedObject {
  name?: string;
  address?: string;
  alias?: string;
  bodyBytecodeHash?: string;
  packageName?: string;
  package?: string;
  implementation?: string;
  version?: string;
}

export default class StatusComparator {
  public reports: StatusReport[];

  public constructor() {
    this.reports = [];
  }

  public onEndChecking(): void {
    this.reports.forEach(report => report.log(log));
    if (this.reports.length === 0) log.info('Your project is up to date.');
  }

  public onMismatchingVersion(expected: string, observed: string): void {
    this._addReport(expected, observed, 'App version does not match');
  }

  public onMismatchingPackage(expected: string, observed: string): void {
    this._addReport(expected, observed, 'Package address does not match');
  }

  public onMismatchingProvider(expected: string, observed: string): void {
    this._addReport(expected, observed, 'Provider address does not match');
  }

  public onUnregisteredLocalImplementation(
    expected: string,
    observed: string,
    { alias, address }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      observed,
      `A contract ${alias} at ${address} is not registered`,
    );
  }

  public async onMissingRemoteImplementation(
    expected: string,
    observed: string,
    { alias, address }: ComparedObject,
  ): Promise<void> {
    this._addReport(
      expected,
      observed,
      `Missing registered contract ${alias} at ${address}`,
    );
  }

  public onMismatchingImplementationAddress(
    expected: string,
    observed: string,
    { alias, address }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      address,
      `Address for contract ${alias} does not match`,
    );
  }

  public onMismatchingImplementationBodyBytecode(
    expected: string,
    observed: string,
    { alias, address, bodyBytecodeHash }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      observed,
      `Bytecode at ${address} for contract ${alias} does not match`,
    );
  }

  public onUnregisteredLocalProxy(
    expected: string,
    observed: string,
    { alias, address, implementation }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      observed,
      `A proxy of ${alias} at ${address} pointing to ${implementation} is not registered`,
    );
  }

  public onMissingRemoteProxy(
    expected: string,
    observed: string,
    { alias, address, implementation }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      observed,
      `Missing registered proxy of ${alias} at ${address} pointing to ${implementation}`,
    );
  }

  public onMismatchingProxyAlias(
    expected: string,
    observed: string,
    { address, implementation }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      observed,
      `Alias of proxy at ${address} pointing to ${implementation} does not match`,
    );
  }
  public onMismatchingProxyImplementation(
    expected: string,
    observed: string,
    { alias, address }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      observed,
      `Pointed implementation of ${alias} proxy at ${address} does not match`,
    );
  }

  public onUnregisteredProxyImplementation(
    expected: string,
    observed: string,
    { address, implementation }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      observed,
      `Proxy at ${address} is pointing to ${implementation} but given implementation is not registered in project`,
    );
  }

  public onMultipleProxyImplementations(
    expected: string,
    observed: string,
    { implementation }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      observed,
      `The same implementation address ${implementation} was registered under many aliases`,
    );
  }

  public onMissingDependency(
    expected: string,
    observed: string,
    { name, address }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      observed,
      `Missing registered dependency ${name} at ${address}`,
    );
  }

  public onMismatchingDependencyAddress(
    expected: string,
    observed: string,
    { name, address }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      observed,
      `Package address of ${name} does not match`,
    );
  }

  public onMismatchingDependencyVersion(
    expected: string,
    observed: string,
    { name, version }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      observed,
      `Package version of ${name} does not match`,
    );
  }

  public onUnregisteredDependency(
    expected: string,
    observed: string,
    { name, package: packageAddress }: ComparedObject,
  ): void {
    this._addReport(
      expected,
      observed,
      `Dependency with name ${name} at address ${packageAddress} is not registered`,
    );
  }

  private _addReport(
    expected: string,
    observed: string,
    description: string,
  ): void {
    const report = new StatusReport(expected, observed, description);
    this.reports.push(report);
  }
}
