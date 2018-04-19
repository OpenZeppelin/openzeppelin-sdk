import PackageFilesInterface from '../../utils/PackageFilesInterface'

const DEFAULT_VERSION = '0.1.0'
const BASE_PACKAGE = {
  'version': null,
  'contracts': {},
  'stdlib': {}
}

export default function init(name, version, { from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName);
  const zosPackage = BASE_PACKAGE

  zosPackage.name = name
  zosPackage.version = version || DEFAULT_VERSION

  files.write(zosPackage)
}
