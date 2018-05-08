import Stdlib from "../models/stdlib/Stdlib";
import AppController from  '../models/AppController'

export default async function init({ name, version, stdlibNameVersion = undefined, installDeps = false, packageFileName = undefined }) {
  if (name === undefined) throw 'Must provide a project name'
  
  const appController = new AppController(packageFileName)
  appController.init(name, version)  
  await appController.setStdlib(stdlibNameVersion, installDeps)
  appController.writePackage()
}
