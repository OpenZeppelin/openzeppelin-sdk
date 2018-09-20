'use strict'

export class DeployError extends Error {
  constructor(message, thepackage, directory) {
    super(message)
    this.package = thepackage
    this.directory = directory
  }
}

export class AppDeployError extends DeployError {
  constructor(message, thepackage, directory, app) {
    super(message, thepackage, directory)
    this.app = app
  }
}

