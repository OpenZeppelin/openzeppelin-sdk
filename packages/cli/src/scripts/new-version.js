import PackageFilesInterface from '../utils/PackageFilesInterface'


function newVersion(version, ...args) {
  const zosPackage = PackageFilesInterface.read()
  zosPackage.version = version
  zosPackage.contracts = {}
  PackageFilesInterface.write(zosPackage)
}


function run() {
  const args = process.argv.slice(2)
  newVersion(...args)
}

run()