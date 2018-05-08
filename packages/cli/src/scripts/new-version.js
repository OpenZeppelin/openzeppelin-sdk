import Stdlib from "../models/stdlib/Stdlib"
import AppController from  '../models/AppController'

export default async function newVersion({ version, stdlibNameVersion = undefined, installDeps = false, packageFileName = undefined }) {
  const appController = new AppController(packageFileName)
  appController.newVersion(version)
  await appController.setStdlib(stdlibNameVersion, installDeps)
  appController.writePackage()
}
