import Stdlib from "../models/stdlib/Stdlib"
import StdlibInstaller from "../models/stdlib/StdlibInstaller"
import PackageFilesInterface from '../utils/PackageFilesInterface'

export default async function setStdlib({ stdlibNameVersion, installDeps = false, packageFileName = null }) {
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  const stdlib = installDeps ? await StdlibInstaller.call(stdlibNameVersion) : new Stdlib(stdlibNameVersion)
  await files.setStdlib(zosPackage, stdlib)
  files.write(zosPackage)
}
