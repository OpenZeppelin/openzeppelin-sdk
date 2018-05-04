import Stdlib from "../models/stdlib/Stdlib"
import AppController from "../models/AppController";

export default async function setStdlib({ stdlibNameVersion, installDeps = false, packageFileName = null }) {
  const appController = new AppController(packageFileName)
  await appController.setStdlib(stdlibNameVersion, installDeps)
  appController.writePackage()
}
