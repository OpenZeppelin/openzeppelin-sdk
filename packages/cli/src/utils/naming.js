// TODO: Testme

export function toContractFullName(packageName, contractName) {
  if (!packageName) return contractName
  return [packageName, contractName].join('/')
}

export function fromContractFullName(contractFullName, defaultPackageName = null) {
  // FIXME: Support package names with slash (i.e. org/name)
  const [packageName, contractName] = contractFullName.split('/')
  if (!contractName) return { contract: packageName, package: defaultPackageName }
  return { contract: contractName, package: packageName }
}