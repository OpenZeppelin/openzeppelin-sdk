import PackageFilesInterface from '../utils/PackageFilesInterface'

const interface = new PackageFilesInterface()

function newVersion(version, ...args) {
  const zosPackage = interface.read()
  zosPackage.version = version
  zosPackage.contracts = {}
  interface.write(zosPackage)
}


function run() {
  const args = process.argv.slice(2)
  newVersion(...args)
}

run()