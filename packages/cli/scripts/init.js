import packageFileInterface from '../utils/packageFileInterface'

let DEFAULT_VERSION = '0.0.1'

let BASE_PACKAGE = {
  'contracts': {},
  'stdlib': {}
}

function init(projectName, version) {
  let zosPackage = BASE_PACKAGE

  zosPackage.projectName = projectName
  zosPackage.version = version || DEFAULT_VERSION

  packageFileInterface.write(zosPackage)
}


function run() {
  let { argv } = process
  init(argv[2], argv[3])
}

run()