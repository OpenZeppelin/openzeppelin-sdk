import ControllerFor from "../models/local/ControllerFor";
import stdout from '../utils/stdout';

export default async function linkStdlib({ stdlibNameVersion, installDeps = false, packageFileName = undefined }) {
  if (!stdlibNameVersion) {
    throw Error('The stdlib name and version to be linked must be provided.')
  }
  const appController = ControllerFor(packageFileName)
  if (appController.isLib()) {
    throw Error("Libraries cannot use a stdlib");
  }
  await appController.linkStdlib(stdlibNameVersion, installDeps)
  appController.writePackage()
  stdout(stdlibNameVersion)
}
