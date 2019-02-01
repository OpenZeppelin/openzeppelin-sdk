import forEach from 'lodash.foreach';
import { AppProject, PackageProject, ProxyAdminProject, App, Package, ImplementationDirectory } from 'zos-lib';

import NetworkController from './NetworkController';
import ZosPackageFile from '../files/ZosPackageFile';
import ZosNetworkFile from '../files/ZosNetworkFile';

interface PartialDeploy {
  app?: App;
  thepackage?: Package;
  directory?: ImplementationDirectory;
}

interface ExistingAddresses {
  appAddress?: string;
  packageAddress?: string;
  proxyAdminAddress?: string;
}

type CreateProjectFn = (addresses: ExistingAddresses) => Promise<AppProject>;

class BaseProjectDeployer {
  protected controller: NetworkController;
  protected packageFile: ZosPackageFile;
  protected networkFile: ZosNetworkFile;
  protected txParams: any;
  protected requestedVersion: string;

  constructor(controller: NetworkController, requestedVersion: string) {
    this.controller = controller;
    this.packageFile = controller.packageFile;
    this.networkFile = controller.networkFile;
    this.txParams = controller.txParams;
    this.requestedVersion = requestedVersion;
  }
}

class BasePackageProjectDeployer extends BaseProjectDeployer {
  get packageAddress(): string {
    return this.controller.packageAddress;
  }

  protected _tryRegisterPartialDeploy({ thepackage, directory }: PartialDeploy): void {
    if (thepackage) this._registerPackage(thepackage);
    if (directory) this._registerVersion(this.requestedVersion, directory);
  }

  protected _registerPackage({ address }: { address: string }): void {
    this.networkFile.package = { address };
  }

  protected _registerVersion(version: string, { address }: { address: string }): void {
    this.networkFile.provider = { address };
    this.networkFile.version = version;
  }
}

export class PackageProjectDeployer extends BasePackageProjectDeployer {
  public project: PackageProject;

  public async fetchOrDeploy(): Promise<PackageProject> {
    try {
      const packageAddress: string = this.packageAddress;
      this.project = await PackageProject.fetchOrDeploy(this.requestedVersion, this.txParams, { packageAddress });
      this._registerPackage(await this.project.getProjectPackage());
      this._registerVersion(this.requestedVersion, await this.project.getCurrentDirectory());
      return this.project;
    } catch(deployError) {
      this._tryRegisterPartialDeploy(deployError);
      if (!this.project) throw deployError;
    }
  }
}

export class AppProjectDeployer extends BasePackageProjectDeployer {
  public project: AppProject;

  public async fetchOrDeploy(): Promise<AppProject> {
    return this._run((existingAddresses: ExistingAddresses) => (
      AppProject.fetchOrDeploy(this.packageFile.name, this.requestedVersion, this.txParams, existingAddresses)
    ));
  }

  public async fromProxyAdminProject(proxyAdminProject: ProxyAdminProject): Promise<AppProject> {
    return this._run((existingAddresses: ExistingAddresses) => (
      AppProject.fromProxyAdminProject(proxyAdminProject, this.requestedVersion, existingAddresses)
    ));
  }

  get appAddress(): string {
    return this.controller.appAddress;
  }

  get proxyAdminAddress(): string {
    return this.networkFile.proxyAdminAddress;
  }

  private async _run(createProjectFn: CreateProjectFn): Promise<AppProject | never> {
    try {
      const { appAddress, packageAddress, proxyAdminAddress }: ExistingAddresses = this;
      this.project = await createProjectFn({ appAddress, packageAddress, proxyAdminAddress });
      await this._registerDeploy();
      return this.project;
    } catch (deployError) {
      this._tryRegisterPartialDeploy(deployError);
      if (!this.project) throw deployError;
    }
  }

  protected _tryRegisterPartialDeploy({ thepackage, app, directory }: PartialDeploy): void {
    super._tryRegisterPartialDeploy({ thepackage, directory });
    if (app) this._registerApp(app);
  }

  private async _registerDeploy(): Promise<void> {
    this._registerApp(this.project.getApp());
    this._registerPackage(await this.project.getProjectPackage());
    this._registerVersion(this.requestedVersion, await this.project.getCurrentDirectory());
  }

  private _registerApp({ address }: { address: string }): void {
    this.networkFile.app = { address };
  }
}

export class ProxyAdminProjectDeployer extends BaseProjectDeployer {
  public project: ProxyAdminProject;

  public async fetchOrDeploy(): Promise<ProxyAdminProject> {
    this.project = await ProxyAdminProject.fetch(this.packageFile.name, this.txParams, this.networkFile.proxyAdminAddress);
    this.networkFile.version = this.requestedVersion;
    forEach(this.networkFile.contracts, (contractInfo, contractAlias) => {
      this.project.registerImplementation(contractAlias, { address: contractInfo.address, bytecodeHash: contractInfo.bodyBytecodeHash });
    });
    forEach(this.networkFile.dependencies, (dependencyInfo, dependencyName) => {
      this.project.setDependency(dependencyName, dependencyInfo.package, dependencyInfo.version);
    });

    return this.project;
  }
}
