import LocalAppController from  '../models/local/LocalAppController'

export default async function init({ name, version, stdlibNameVersion = undefined, installDeps = false, packageFileName = undefined }) {
  if (name === undefined) throw Error('A project name must be provided to initialize the project.')
  
  const appController = new LocalAppController(packageFileName)
  appController.init(name, version)
  await appController.linkStdlib(stdlibNameVersion, installDeps)
  appController.writePackage()
}
