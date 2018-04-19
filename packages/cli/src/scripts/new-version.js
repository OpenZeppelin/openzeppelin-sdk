import PackageFilesInterface from '../utils/PackageFilesInterface'


export default function newVersion(version, { network, from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  zosPackage.version = version
  zosPackage.contracts = {}
  files.write(zosPackage)
}