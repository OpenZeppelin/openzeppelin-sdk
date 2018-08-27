import LocalAppController from  '../models/local/LocalAppController'
import ZosPackageFile from "../models/files/ZosPackageFile"

export default async function init({ name, version, libs = [], installLibs = false, force = false, packageFile = new ZosPackageFile() }) {
  if (!name) throw Error('A project name must be provided to initialize the project.')
  
  const controller = new LocalAppController(packageFile)
  controller.init(name, version, force)
  if (!libs.length) await controller.linkLibs(libs, installLibs)
  controller.writePackage()
}
