import log from '../helpers/log'
import { scripts } from 'zos'
import { Contracts, ABI } from 'zos-lib'
import { ZEPTOKEN_ATTRIBUTE_ID, VOUCHING_MIN_STAKE } from '../constants'
import { printJurisdictionInformation, printVouchingInformation, printZepTokenInformation, printZepValidatorInformation } from './printKernelInformation'

const { create } = scripts
const { buildCallData, callDescription } = ABI

export default async function createKernelContracts(options) {
  const owner = options.txParams.from
  const jurisdiction = await createBasicJurisdiction(owner, options)
  const zepToken = await createZEPToken(owner, jurisdiction, options)
  const vouching = await createVouching(zepToken, options)
  const validator = await createZEPValidator(owner, jurisdiction, options)
  return { jurisdiction, validator, zepToken, vouching }
}

export async function createBasicJurisdiction(owner, options) {
  printJurisdictionInformation(owner)
  const packageName = 'tpl-contracts-zos'
  const contractAlias = 'BasicJurisdiction'
  const initMethod = 'initialize'
  const initArgs = [owner]
  try {
    const basicJurisdiction = await create({ packageName, contractAlias, initMethod, initArgs, ...options})
    log.info(` ✔ BasicJurisdiction created at ${basicJurisdiction.address}`)
    return basicJurisdiction
  } catch (error) {
    const BasicJurisdiction = Contracts.getFromNodeModules(packageName, contractAlias)
    const { method } = buildCallData(BasicJurisdiction, initMethod, initArgs);
    log.error(` ✘ Could not create basic jurisdiction by calling ${callDescription(method, initArgs)}`)
    throw error
  }
}

export async function createZEPToken(owner, basicJurisdiction, options) {
  printZepTokenInformation(owner, basicJurisdiction)
  const packageName = 'zos-vouching'
  const contractAlias = 'ZEPToken'
  const initMethod = 'initialize'
  const initArgs = [owner, basicJurisdiction.address, ZEPTOKEN_ATTRIBUTE_ID]
  try {
    const zepToken = await create({ packageName, contractAlias, initMethod, initArgs, ...options })
    log.info(` ✔ ZEPToken created at ${zepToken.address}`)
    return zepToken
  } catch (error) {
    const ZEPToken = Contracts.getFromLocal(contractAlias)
    const { method } = buildCallData(ZEPToken, initMethod, initArgs);
    log.error(` ✘ Could not create ZEP token by calling ${callDescription(method, initArgs)}`)
    throw error
  }
}

export async function createZEPValidator(owner, basicJurisdiction, options) {
  printZepValidatorInformation(owner, basicJurisdiction)
  const packageName = 'zos-vouching'
  const contractAlias = 'ZEPValidator'
  const initMethod = 'initialize'
  const initArgs = [owner, basicJurisdiction.address, ZEPTOKEN_ATTRIBUTE_ID]
  try {
    const zepValidator = await create({ packageName, contractAlias, initMethod, initArgs, ...options })
    log.info(` ✔ ZEPValidator created at ${zepValidator.address}`)
    return zepValidator
  } catch (error) {
    const ZEPValidator = Contracts.getFromLocal(contractAlias)
    const { method } = buildCallData(ZEPValidator, initMethod, initArgs);
    log.error(` ✘ Could not create ZEP validator by calling ${callDescription(method, initArgs)}`)
    throw error
  }
}

export async function createVouching(zepToken, options) {
  printVouchingInformation(zepToken)
  const packageName = 'zos-vouching'
  const contractAlias = 'Vouching'
  const initMethod = 'initialize'
  const initArgs = [VOUCHING_MIN_STAKE, zepToken.address]
  try {
    const vouching = await create({packageName, contractAlias, initMethod, initArgs, ...options})
    log.info(` ✔ Vouching created at ${vouching.address}`)
    return vouching
  } catch (error) {
    const Vouching = Contracts.getFromLocal(contractAlias)
    const { method } = buildCallData(Vouching, initMethod, initArgs);
    log.error(` ✘ Could not create vouching contract by calling ${callDescription(method, initArgs)}`)
    throw error
  }
}
