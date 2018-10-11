import log from '../helpers/log'
import { ZEPTOKEN_ATTRIBUTE_ID, VOUCHING_MIN_STAKE } from '../constants'

export function printJurisdictionInformation(owner) {
  log.base('\n--------------------------------------------------------------------\n\n')
  log.base(`Creating BasicJurisdiction instance for: `)
  log.base(` - Owner: ${owner}\n`)
}

export function printZepTokenInformation(owner, basicJurisdiction = undefined) {
  log.base('\n--------------------------------------------------------------------\n\n')
  log.base(`Creating ZEPToken instance for: `)
  log.base(` - Owner:              ${owner}`)
  log.base(` - Attribute ID:       ${ZEPTOKEN_ATTRIBUTE_ID}`)
  log.base(` - Basic Jurisdiction: [${basicJurisdiction ? basicJurisdiction.address : 'a new instance to be created'}]\n`)
}

export function printZepValidatorInformation(owner, basicJurisdiction = undefined) {
  log.base('\n--------------------------------------------------------------------\n\n')
  log.base(`Creating ZEPValidator instance for: `)
  log.base(` - Owner:              ${owner}`)
  log.base(` - Attribute ID:       ${ZEPTOKEN_ATTRIBUTE_ID}`)
  log.base(` - Basic Jurisdiction: [${basicJurisdiction ? basicJurisdiction.address : 'a new instance to be created'}]\n`)
}

export function printVouchingInformation(zepToken = undefined) {
  log.base('\n--------------------------------------------------------------------\n\n')
  log.base(`Creating Vouching instance for: `)
  log.base(` - Minimum stake:  ${VOUCHING_MIN_STAKE}`)
  log.base(` - ZEP token:      [${zepToken ? zepToken.address : 'a new instance to be created'}]\n`)
}
