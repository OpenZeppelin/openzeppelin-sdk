import { isEmpty, isString } from 'lodash';
import utils from 'web3-utils';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// TS-TODO: Web3 typings? => contract.
export function toAddress(contractOrAddress: string | any): string {
  if (isEmpty(contractOrAddress)) throw Error(`Contract or address expected`);
  else if (isString(contractOrAddress)) return utils.toChecksumAddress(contractOrAddress);
  else return utils.toChecksumAddress(contractOrAddress.address);
}

export function isZeroAddress(address: string): boolean {
  return !address || address === ZERO_ADDRESS;
}

// TS-TODO: if uint256 is a string, then why are we doing uint256.toString()?
export function uint256ToAddress(uint256: string): string {
  const padded = utils.leftPad(uint256.toString(), 64);
  const address = padded.replace('0x000000000000000000000000', '0x');
  return utils.toChecksumAddress(address);
}
