import PackageFilesInterface from '../utils/PackageFilesInterface'


async function newVersion(version, { network, from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  zosPackage.version = version
  zosPackage.contracts = {}
  files.write(zosPackage)
}

module.exports = newVersion
