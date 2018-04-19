import PackageFilesInterface from '../utils/PackageFilesInterface'

const interface = new PackageFilesInterface()

export default function newVersion(version, ...args, { from, network }) {
  const zosPackage = interface.read()
  zosPackage.version = version
  zosPackage.contracts = {}
  interface.write(zosPackage)
}