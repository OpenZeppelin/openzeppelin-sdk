import stdout from '../utils/stdout';
import ControllerFor from "../models/local/ControllerFor";

export default async function linkStdlib({ libs = [], installLibs = false, packageFile = undefined }) {
  const controller = ControllerFor(packageFile)
  if (!libs.length) throw Error('At least one library name and version to be linked must be provided.')
  if (controller.isLib) throw Error('Libraries cannot use a stdlib.')

  await controller.linkLibs(libs, installLibs)
  controller.writePackage()
  libs.forEach(libNameVersion => stdout(libNameVersion))
}
