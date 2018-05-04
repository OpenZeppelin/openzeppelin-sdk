import Stdlib from "../models/stdlib/Stdlib"
import AppController from  '../models/AppController'

export default async function newVersion({ version, stdlibNameVersion = null, installDeps = false, packageFileName = null }) {
  const appController = new AppController(packageFileName)
  appController.newVersion(version)
  await appController.setStdlib(stdlibNameVersion, installDeps)
  appController.writePackage()
}
