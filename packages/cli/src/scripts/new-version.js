import PackageFilesInterface from '../utils/PackageFilesInterface'

async function newVersion(version, { network, from, packageFileName, stdlib, installDeps }) {
  if (version === undefined) throw 'Must provide the new project version'
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  zosPackage.version = version
  zosPackage.contracts = {}
  await files.setStdlib(zosPackage, stdlib, installDeps)
  files.write(zosPackage)
}

module.exports = newVersion
