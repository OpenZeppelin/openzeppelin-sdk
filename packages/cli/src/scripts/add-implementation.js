import PackageFilesInterface from '../utils/PackageFilesInterface'

const interface = new PackageFilesInterface()

export default function addImplementation(contractName, alias, ...args, { network, from }) {
  const zosPackage = interface.read()
  zosPackage.contracts[alias] = contractName
  interface.write(zosPackage)
}
