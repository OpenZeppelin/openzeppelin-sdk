import _ from 'lodash';

export const ZERO_ADDRESS: string = '0x0000000000000000000000000000000000000000';

// TS-TODO: Web3 typings? => contract.
export function toAddress(contractOrAddress: string | any): string {
  if (_.isEmpty(contractOrAddress)) {
    throw Error(`Contract or address expected`);
  } else if (_.isString(contractOrAddress)) {
    return contractOrAddress;
  } else {
    return contractOrAddress.address;
  }
}

export function isZeroAddress(address: string): boolean {
  return !address || address === ZERO_ADDRESS;
}

// TS-TODO: if uint256 is a string, then why are we doing uint256.toString()?
export function uint256ToAddress(uint256: string): string {
  return uint256.toString().replace('0x000000000000000000000000', '0x');
}
