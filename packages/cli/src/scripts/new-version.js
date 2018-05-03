import Stdlib from "../models/stdlib/Stdlib"
import StdlibInstaller from "../models/stdlib/StdlibInstaller"
import PackageFilesInterface from '../utils/PackageFilesInterface'

export default async function newVersion({ version, stdlibNameVersion = null, installDeps = false, packageFileName = null }) {
  if (version === undefined) throw 'Must provide the new project version'
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  zosPackage.version = version
  zosPackage.contracts = {}
  zosPackage.stdlib = {}

  if(stdlibNameVersion) {
    const stdlib = installDeps ? await StdlibInstaller.call(stdlibNameVersion) : new Stdlib(stdlibNameVersion)
    await files.setStdlib(zosPackage, stdlib)
  }

  files.write(zosPackage)
}
