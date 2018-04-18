import packageFileInterface from '../utils/packageFileInterface'

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

  packageFileInterface.write(zosPackage)
}


function run() {
  const { argv } = process
  init(argv[2], argv[3])
}

run()