import pickBy from 'lodash.pickby';

export function toContractFullName(packageName: string, contractName: string): string {
  if (!packageName) return contractName;
  return [packageName, contractName].join('/');
}

export function fromContractFullName(contractFullName: string): { contract?: string; package?: string } {
  if (!contractFullName) return {};
  const fragments = contractFullName.split('/');
  if (fragments.length === 2) return { contract: contractFullName };
  else return pickBy({ contract: fragments.slice(1).join('/'), package: fragments[0] });
}
