import _ from 'lodash';

export function toContractFullName(packageName, contractName) {
  if (!packageName) return contractName
  return [packageName, contractName].join('/')
}

export function fromContractFullName(contractFullName) {
  if (!contractFullName) return {}
  const fragments = contractFullName.split('/')
  const contractName = fragments.pop()
  if (fragments.length === 0) return { contract: contractName }
  else return _.pickBy({ contract: contractName, package: fragments.join('/') })
}