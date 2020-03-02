import { pickBy } from 'lodash';

export function toContractFullName(packageName: string, contractName: string): string {
  if (!packageName) return contractName;
  return [packageName, contractName].join('/');
}

export function fromContractFullName(contractFullName: string): { contractName?: string; package?: string } {
  if (!contractFullName) return {};
  const fragments = contractFullName.split('/');
  const contractName = fragments.pop();
  if (fragments.length === 0) return { contractName };
  else return pickBy({ contractName, package: fragments.join('/') });
}
