import ControllerFor from  '../models/local/ControllerFor'
import stdout from '../utils/stdout';

export default async function bumpVersion({ version, stdlibNameVersion = undefined, installDeps = false, packageFileName = undefined }) {
  if (version === undefined || version === '') throw Error('A version name must be provided to initialize a new version.')

  const appController = ControllerFor(packageFileName)
  if (stdlibNameVersion && appController.isLib()) {
    throw Error("Cannot link a stdlib for a lib project");
  }

  appController.bumpVersion(version)
  if (!appController.isLib()) {
    await appController.linkStdlib(stdlibNameVersion, installDeps)
  }

  appController.writePackage()
  stdout(version)
}
