import Stdlib from "../models/stdlib/Stdlib";
import AppController from  '../models/AppController'

export default async function init({ name, version, stdlibNameVersion = null, installDeps = false, packageFileName = null }) {
  if (name === undefined) throw 'Must provide a project name'
  
  const appController = new AppController(packageFileName)
  appController.init(name, version)  
  await appController.setStdlib(stdlibNameVersion, installDeps)
  appController.writePackage()
}
