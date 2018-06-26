import stdout from '../utils/stdout';
import ControllerFor from "../models/local/ControllerFor";

export default async function linkStdlib({ stdlibNameVersion, installLib = false, packageFile = undefined }) {
  if (!stdlibNameVersion) throw Error('The stdlib name and version to be linked must be provided.')

  const controller = ControllerFor(packageFile)
  if (controller.isLib) throw Error("Libraries cannot use a stdlib");

  await controller.linkStdlib(stdlibNameVersion, installLib)
  controller.writePackage()
  stdout(stdlibNameVersion)
}
