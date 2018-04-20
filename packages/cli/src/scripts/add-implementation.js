import PackageFilesInterface from '../utils/PackageFilesInterface'

async function addImplementation(contractName, alias, { packageFileName }) {
  if (contractName === undefined) throw  'Must provide a contract name'
  if (alias === undefined) throw 'Must provide an alias'
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  zosPackage.contracts[alias] = contractName
  files.write(zosPackage)
}

module.exports = addImplementation
