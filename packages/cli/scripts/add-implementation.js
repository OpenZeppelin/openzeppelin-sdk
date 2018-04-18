import PackageFilesInterface from '../utils/PackageFilesInterface'


function addImplementation(contractName, alias, ...args) {
  const zosPackage = PackageFilesInterface.read()
  zosPackage.contracts[alias] = contractName
  PackageFilesInterface.write(zosPackage)
}


function run() {
  const args = process.argv.slice(2)
  addImplementation(...args)
}

run()