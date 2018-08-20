import _ from 'lodash'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function toAddress(contractOrAddress) {
  if (_.isEmpty(contractOrAddress)) {
    throw Error(`Contract or address expected`)
  } else if (_.isString(contractOrAddress)) {
    return contractOrAddress
  } else {
    return contractOrAddress.address
  }
}

export function isZeroAddress(address) {
  return !address || address === ZERO_ADDRESS
}