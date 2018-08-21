// TODO: Testme

export function toContractFullName(packageName, contractName) {
  if (!packageName) return contractName
  return [packageName, contractName].join('/')
}

export function fromContractFullName(contractFullName) {
  // FIXME: Support package names with slash (i.e. org/name)
  const fragments = contractFullName.split('/')
  const contractName = fragments.pop()
  if (fragments.length === 0) return { contract: contractName }
  else return { contract: contractName, package: fragments.join('/') }
}