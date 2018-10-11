import LocalAppController from  '../models/local/LocalAppController'
import ZosPackageFile from "../models/files/ZosPackageFile"

export default async function init({ name, version, full = false, libs = [], installLibs = false, force = false, packageFile = new ZosPackageFile("zos.json", false) }) {
  if (!name) throw Error('A project name must be provided to initialize the project.')
  
  const controller = new LocalAppController(packageFile)
  controller.init(name, version, force, full)
  if (libs.length !== 0) await controller.linkLibs(libs, installLibs)
  controller.writePackage()
}
