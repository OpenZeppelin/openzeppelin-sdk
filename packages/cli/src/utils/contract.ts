import { Contracts, Contract } from '@openzeppelin/upgrades';
import { fromContractFullName } from './naming';
import Dependency from '../models/dependency/Dependency';

export interface ParsedContractReference {
  proxyAddress: string | undefined;
  contractAlias: string | undefined;
  packageName: string | undefined;
}

export function parseContractReference(contractReference: string): ParsedContractReference {
  let proxyAddress;
  let contractAlias;
  let packageName;

  if (contractReference && contractReference.startsWith('0x')) {
    proxyAddress = contractReference;
  } else if (contractReference) {
    ({ contract: contractAlias, package: packageName } = fromContractFullName(contractReference));
  }

  return { proxyAddress, contractAlias, packageName };
}
