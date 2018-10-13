import { Contracts } from 'zos-lib'
import validateAddress from '../helpers/validateAddress'

export function fetchJurisdiction(networkFile) {
  const jurisdictionProxies = networkFile._proxiesOf('tpl-contracts-zos/BasicJurisdiction')
  if (jurisdictionProxies.length > 0) {
    const jurisdictionAddress = jurisdictionProxies[jurisdictionProxies.length - 1].address
    if (validateAddress(jurisdictionAddress)) {
      const BasicJurisdiction = Contracts.getFromNodeModules('tpl-contracts-zos', 'BasicJurisdiction')
      return BasicJurisdiction.at(jurisdictionAddress)
    }
  }
}

export function fetchZepToken(networkFile) {
  const zepTokenProxies = networkFile._proxiesOf('zos-vouching/ZEPToken')
  if (zepTokenProxies.length > 0) {
    const zepTokenAddress = zepTokenProxies[zepTokenProxies.length - 1].address
    if (validateAddress(zepTokenAddress)) {
      const ZEPToken = Contracts.getFromLocal('ZEPToken')
      return ZEPToken.at(zepTokenAddress)
    }
  }
}

export function fetchVouching(networkFile) {
  const vouchingProxies = networkFile._proxiesOf('zos-vouching/Vouching')
  if (vouchingProxies.length > 0) {
    const vouchingAddress = vouchingProxies[vouchingProxies.length - 1].address
    if (validateAddress(vouchingAddress)) {
      const Vouching = Contracts.getFromLocal('Vouching')
      return Vouching.at(vouchingAddress)
    }
  }
}

export function fetchValidator(networkFile) {
  const validatorProxies = networkFile._proxiesOf('zos-vouching/ZEPValidator')
  if (validatorProxies.length > 0) {
    const validatorAddress = validatorProxies[validatorProxies.length - 1].address
    if (validateAddress(validatorAddress)) {
      const ZEPValidator = Contracts.getFromLocal('ZEPValidator')
      return ZEPValidator.at(validatorAddress)
    }
  }
}
