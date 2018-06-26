import stdout from '../utils/stdout';
import ControllerFor from '../models/local/ControllerFor'

export default async function bumpVersion({ version, stdlibNameVersion = undefined, installLib = false, packageFile = undefined }) {
  const controller = ControllerFor(packageFile)
  if (version === undefined || version === '') throw Error('A version name must be provided to initialize a new version.')
  if (stdlibNameVersion && controller.isLib) throw Error('Cannot link a stdlib for a lib project')

  controller.bumpVersion(version)
  if (!controller.isLib) {
    await controller.linkStdlib(stdlibNameVersion, installLib)
  }

  controller.writePackage()
  stdout(version)
}
