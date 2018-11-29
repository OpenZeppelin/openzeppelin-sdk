import stdout from '../utils/stdout';
import ControllerFor from "../models/local/ControllerFor";

export default async function link({ dependencies = [], installDependencies = false, packageFile = undefined }) {
  const controller = ControllerFor(packageFile)
  if (!dependencies.length) throw Error('At least one dependency name and version to be linked must be provided.')

  await controller.linkDependencies(dependencies, installDependencies)
  controller.writePackage()
  dependencies.forEach(depNameVersion => stdout(depNameVersion))
}
