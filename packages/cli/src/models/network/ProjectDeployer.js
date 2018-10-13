import { AppProject, LibProject, SimpleProject } from "zos-lib";
import _ from 'lodash';

class BaseProjectDeployer {
  constructor(controller, requestedVersion) {
    this.controller = controller
    this.packageFile = controller.packageFile
    this.networkFile = controller.networkFile
    this.txParams = controller.txParams
    this.requestedVersion = requestedVersion
  }
}

class BasePackageProjectDeployer extends BaseProjectDeployer {
  get packageAddress() {
    return this.controller.packageAddress
  }

  _tryRegisterPartialDeploy({ thepackage, directory }) {
    if (thepackage) this._registerPackage(thepackage)
    if (directory) this._registerVersion(this.requestedVersion, directory)
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
    this.networkFile.version = this.requestedVersion
    _.forEach(this.networkFile.contracts, (contractInfo, contractAlias) => {
      this.project.registerImplementation(contractAlias, contractInfo)
    })
    _.forEach(this.networkFile.dependencies, (dependencyInfo, dependencyName) => {
      this.project.setDependency(dependencyName, dependencyInfo.package, dependencyInfo.version)
    })

    return this.project
  }
}

export class LibProjectDeployer extends BasePackageProjectDeployer {
  async fetchOrDeploy() {
    try {
      const packageAddress = this.packageAddress
      this.project = await LibProject.fetchOrDeploy(this.requestedVersion, this.txParams, { packageAddress })
      this._registerPackage(await this.project.getProjectPackage())
      this._registerVersion(this.requestedVersion, await this.project.getCurrentDirectory())
      return this.project
    } catch(deployError) {
      this._tryRegisterPartialDeploy(deployError)
      if (!this.project) throw deployError
    }
  }
}

export class AppProjectDeployer extends BasePackageProjectDeployer {
  async fetchOrDeploy() {
    return this._run(existingAddresses => (
      AppProject.fetchOrDeploy(this.packageFile.name, this.requestedVersion, this.txParams, existingAddresses)
    ))
  }

  async fromSimpleProject(simpleProject) {
    return this._run(existingAddresses => (
      AppProject.fromSimpleProject(simpleProject, this.requestedVersion, this.txParams, existingAddresses)
    ))
  }

  get appAddress() {
    return this.controller.appAddress
  }

  async _run(createProjectFn) {
    try {
      const { appAddress, packageAddress } = this
      this.project = await createProjectFn({ appAddress, packageAddress })
      await this._registerDeploy()
      return this.project
    } catch (deployError) {
      this._tryRegisterPartialDeploy(deployError)
      if (!this.project) throw deployError
    }
  } 

  async _registerDeploy() {
    this._registerApp(this.project.getApp())
    this._registerPackage(await this.project.getProjectPackage())
    this._registerVersion(this.requestedVersion, await this.project.getCurrentDirectory())
  }

  _tryRegisterPartialDeploy({ thepackage, app, directory }) {
    super._tryRegisterPartialDeploy({ thepackage, directory })
    if (app) this._registerApp(app)
  }

  _registerApp({ address }) {
    this.networkFile.app = { address }
  }
}

