import AppController from  '../models/AppController'

export default async function bumpVersion({ version, stdlibNameVersion = undefined, installDeps = false, packageFileName = undefined }) {
  if (version === undefined || version === '') throw Error('A version name must be provided to initialize a new version.')

  const appController = new AppController(packageFileName)
  appController.bumpVersion(version)
  await appController.linkStdlib(stdlibNameVersion, installDeps)
  appController.writePackage()
}
