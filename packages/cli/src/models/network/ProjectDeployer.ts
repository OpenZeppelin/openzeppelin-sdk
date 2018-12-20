import _ from 'lodash';
import { AppProject, PackageProject, SimpleProject, App, Package, ImplementationDirectory } from 'zos-lib';

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

export class SimpleProjectDeployer extends BaseProjectDeployer {
  public project: SimpleProject;

  public async fetchOrDeploy(): Promise<SimpleProject> {
    this.project = new SimpleProject(this.packageFile.name, this.txParams);
    this.networkFile.version = this.requestedVersion;
    _.forEach(this.networkFile.contracts, (contractInfo, contractAlias) => {
      this.project.registerImplementation(contractAlias, contractInfo);
    });
    _.forEach(this.networkFile.dependencies, (dependencyInfo, dependencyName) => {
      this.project.setDependency(dependencyName, dependencyInfo.package, dependencyInfo.version);
    });

    return this.project;
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

  public async fromSimpleProject(simpleProject: SimpleProject): Promise<AppProject> {
    return this._run((existingAddresses: ExistingAddresses) => (
      AppProject.fromSimpleProject(simpleProject, this.requestedVersion, existingAddresses)
    ));
  }

  get appAddress(): string {
    return this.controller.appAddress;
  }

  private async _run(createProjectFn: CreateProjectFn): Promise<AppProject | never> {
    try {
      const { appAddress, packageAddress }: ExistingAddresses = this;
      this.project = await createProjectFn({ appAddress, packageAddress });
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
