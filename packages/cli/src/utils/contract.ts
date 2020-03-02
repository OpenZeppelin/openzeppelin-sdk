import { fromContractFullName } from './naming';

export interface ParsedContractReference {
  proxyAddress: string | undefined;
  contractName: string | undefined;
  packageName: string | undefined;
}

export function parseContractReference(contractReference: string): ParsedContractReference {
  let proxyAddress;
  let contractName;
  let packageName;

  if (contractReference && contractReference.startsWith('0x')) {
    proxyAddress = contractReference;
  } else if (contractReference) {
    ({ contractName, package: packageName } = fromContractFullName(contractReference));
  }

  return { proxyAddress, contractName, packageName };
}
