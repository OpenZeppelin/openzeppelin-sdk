import PackageFilesInterface from '../utils/PackageFilesInterface'

const interface = new PackageFilesInterface()

function addImplementation(contractName, alias, ...args) {
  const zosPackage = interface.read()
  zosPackage.contracts[alias] = contractName
  interface.write(zosPackage)
}


function run() {
  const args = process.argv.slice(2)
  addImplementation(...args)
}

run()