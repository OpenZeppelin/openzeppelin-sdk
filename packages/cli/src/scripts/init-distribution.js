import PackageFilesInterface from '../utils/PackageFilesInterface'

const BASE_DISTRIBUTION = {
  contracts: {},
  kernel: {
    address: null
  }
}

export default function initDistribution({ name, kernelAddress, packageFileName = undefined }) {
  if (name === undefined) throw Error('A distribution name must be provided to be initialized.')
  if (kernelAddress === undefined) throw Error('The kernel address must be provided to initialize a new distribution.')

  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = BASE_DISTRIBUTION

  zosPackage.name = name
  zosPackage.kernel = { address: kernelAddress }
  files.write(zosPackage)
}
