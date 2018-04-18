import PackageFileInterface from '../utils/PackageFileInterface'

const DEFAULT_VERSION = '1.0.0'
const BASE_PACKAGE = {
  'version': null,
  'contracts': {},
  'stdlib': {}
}


function init(name, version) {
  const zosPackage = BASE_PACKAGE

  zosPackage.name = name
  zosPackage.version = version || DEFAULT_VERSION

  PackageFileInterface.writePackageFile(zosPackage)
}


function run() {
  const args = process.argv.slice(2)
  init(...args)
}

run()