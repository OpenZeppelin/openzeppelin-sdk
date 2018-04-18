import packageFileInterface from '../utils/packageFileInterface'

const DEFAULT_VERSION = '1.0.0'
const BASE_PACKAGE = {
  'version': null,
  'contracts': {},
  'stdlib': {}
}


function init(version) {
  const zosPackage = BASE_PACKAGE

  zosPackage.version = version || DEFAULT_VERSION

  packageFileInterface.write(zosPackage)
}


function run() {
  init(process.argv[2])
}

run()