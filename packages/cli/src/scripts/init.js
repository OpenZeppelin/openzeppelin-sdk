import LocalAppController from  '../models/local/LocalAppController'

export default async function init({ name, version, stdlibNameVersion = undefined, installLib = false, force = false, packageFileName = undefined }) {
  if (name === undefined) throw Error('A project name must be provided to initialize the project.')
  
  const appController = new LocalAppController(packageFileName)
  appController.init(name, version, force)
  await appController.linkStdlib(stdlibNameVersion, installLib)
  appController.writePackage()
}
