import { AppProject, LibProject, SimpleProject } from "zos-lib";
import _ from 'lodash';

class BaseProjectDeployer {
  constructor(controller) {
    this.controller = controller
    this.packageFile = controller.packageFile
    this.networkFile = controller.networkFile
    this.txParams = controller.txParams
  }

  get currentVersion() {
    return this.controller.currentVersion
  }
}

class BasePackageProjectDeployer extends BaseProjectDeployer {
  get packageAddress() {
    return this.controller.packageAddress
  }

  _tryRegisterPartialDeploy({ thepackage, directory }) {
    if (thepackage) this._registerPackage(thepackage)
    if (directory) this._registerVersion(this.currentVersion, directory)
  }

  _registerPackage({ address }) {
    this.networkFile.package = { address }
  }

  _registerVersion(version, { address }) {
    this.networkFile.provider = { address }
    this.networkFile.version = version
  }
}

export class SimpleProjectDeployer extends BaseProjectDeployer {
  async fetchOrDeploy() {
    this.project = new SimpleProject(this.packageFile.name, this.txParams)
    this.networkFile.version = this.currentVersion
    _.forEach(this.networkFile.contracts, (contractInfo, contractAlias) => {
      this.project.registerImplementation(contractAlias, contractInfo)
    })

    return this.project
  }
}

export class LibProjectDeployer extends BasePackageProjectDeployer {
  async fetchOrDeploy() {
    try {
      const packageAddress = this.packageAddress
      this.project = await LibProject.fetchOrDeploy(this.currentVersion, this.txParams, { packageAddress })
      this._registerPackage(await this.project.getProjectPackage())
      this._registerVersion(this.currentVersion, await this.project.getCurrentDirectory())
      return this.project
    } catch(deployError) {
      this._tryRegisterPartialDeploy(deployError)
    }
  }
}

export class AppProjectDeployer extends BasePackageProjectDeployer {
  async fetchOrDeploy() {
    try {
      const { appAddress, packageAddress } = this
      this.project = await AppProject.fetchOrDeploy(this.packageFile.name, this.currentVersion, this.txParams, { appAddress, packageAddress })
      this._registerApp(this.project.getApp())
      this._registerPackage(await this.project.getProjectPackage())
      this._registerVersion(this.currentVersion, await this.project.getCurrentDirectory())
      return this.project
    } catch (deployError) {
      this._tryRegisterPartialDeploy(deployError)
    }
  }

  get appAddress() {
    return this.controller.appAddress
  }

  _tryRegisterPartialDeploy({ thepackage, app, directory }) {
    super._tryRegisterPartialDeploy({ thepackage, directory })
    if (app) this._registerApp(app)
  }

  _registerApp({ address }) {
    this.networkFile.app = { address }
  }
}

