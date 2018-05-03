import PackageFilesInterface from '../utils/PackageFilesInterface'

export default function addImplementation({ contractName, contractAlias, packageFileName = null }) {
  if (contractName === undefined) throw  'Must provide a contract name'
  if (contractAlias === undefined) throw 'Must provide an alias'

  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  zosPackage.contracts[contractAlias] = contractName
  files.write(zosPackage)
}
