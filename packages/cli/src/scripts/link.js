import stdout from '../utils/stdout';
import ControllerFor from "../models/local/ControllerFor";

export default async function linkStdlib({ libNameVersion, installLib = false, packageFile = undefined }) {
  const controller = ControllerFor(packageFile)
  if (!libNameVersion) throw Error('The library name and version to be linked must be provided.')
  if (controller.isLib) throw Error('Libraries cannot use a stdlib.')

  await controller.linkLib(libNameVersion, installLib)
  controller.writePackage()
  stdout(libNameVersion)
}
