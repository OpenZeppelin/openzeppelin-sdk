import stdout from '../utils/stdout';
import ControllerFor from "../models/local/ControllerFor";

export default async function linkStdlib({ libs = [], installLibs = false, packageFile = undefined }) {
  const controller = ControllerFor(packageFile)
  if (!libs.length) throw Error('At least one dependency name and version to be linked must be provided.')
  if (controller.isLib) throw Error('Package projects cannot use other packages.')

  await controller.linkLibs(libs, installLibs)
  controller.writePackage()
  libs.forEach(libNameVersion => stdout(libNameVersion))
}
