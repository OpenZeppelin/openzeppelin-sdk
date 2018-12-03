import stdout from '../utils/stdout';
import ControllerFor from "../models/local/ControllerFor";

export default async function link({ libs = [], dependencies = [], installDependencies = false, installLibs = false, packageFile = undefined }) {
  dependencies = dependencies.length === 0 && libs.length !== 0 ? libs : dependencies
  installDependencies = !installDependencies && installLibs ? installLibs : installDependencies

  if (!dependencies.length) throw Error('At least one dependency name and version to be linked must be provided.')
  const controller = ControllerFor(packageFile)

  await controller.linkDependencies(dependencies, installDependencies)
  controller.writePackage()
  dependencies.forEach(depNameVersion => stdout(depNameVersion))
}
