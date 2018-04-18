import PackageFileInterface from '../utils/PackageFileInterface'


function addImplementation(contractName, alias, ...args) {
  const zosPackage = PackageFileInterface.readPackageFile()

  zosPackage.contracts[alias] = contractName

  PackageFileInterface.writePackageFile(zosPackage)
}


function run() {
  const args = process.argv.slice(2)
  addImplementation(...args)
}

run()