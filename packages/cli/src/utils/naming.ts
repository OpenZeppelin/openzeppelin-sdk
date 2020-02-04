import { pickBy } from 'lodash';

export function toContractFullName(packageName: string, contractName: string): string {
  if (!packageName) return contractName;
  return [packageName, contractName].join('/');
}

export function fromContractFullName(contractFullName: string): { contract?: string; package?: string } {
  if (!contractFullName) return {};
  const fragments = contractFullName.split('/');
  const contractName = fragments.pop();
  if (fragments.length === 0) return { contract: contractName };
  else return pickBy({ contract: contractName, package: fragments.join('/') });
}
