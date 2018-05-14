import AppController from  '../models/AppController'

export default async function newVersion({ version, stdlibNameVersion = undefined, installDeps = false, packageFileName = undefined }) {
  if (version === undefined || version === '') throw Error('A version name must be provided to initialize a new version.')

  const appController = new AppController(packageFileName)
  appController.newVersion(version)
  await appController.setStdlib(stdlibNameVersion, installDeps)
  appController.writePackage()
}
