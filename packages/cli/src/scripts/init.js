import AppController from  '../models/AppController'

export default async function init({ name, version, stdlibNameVersion = undefined, installDeps = false, packageFileName = undefined }) {
  if (name === undefined) throw Error('A project name must be provided to initialize the project.')
  
  const appController = new AppController(packageFileName)
  appController.init(name, version)  
  await appController.linkStdlib(stdlibNameVersion, installDeps)
  appController.writePackage()
}
