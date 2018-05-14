import AppController from "../models/AppController";

export default async function setStdlib({ stdlibNameVersion, installDeps = false, packageFileName = undefined }) {
  if(!stdlibNameVersion) throw Error('The stdlib name and version to be set must be provided.')
  const appController = new AppController(packageFileName)
  await appController.setStdlib(stdlibNameVersion, installDeps)
  appController.writePackage()
}
