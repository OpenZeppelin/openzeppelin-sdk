import AppController from "../models/AppController";

export default async function linkStdlib({ stdlibNameVersion, installDeps = false, packageFileName = undefined }) {
  if(!stdlibNameVersion) throw Error('The stdlib name and version to be linked must be provided.')
  const appController = new AppController(packageFileName)
  await appController.linkStdlib(stdlibNameVersion, installDeps)
  appController.writePackage()
}
