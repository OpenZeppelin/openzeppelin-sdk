import PackageFilesInterface from '../utils/PackageFilesInterface'


module.exports = async function addImplementation(contractName, alias, { packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  zosPackage.contracts[alias] = contractName
  files.write(zosPackage)
}
