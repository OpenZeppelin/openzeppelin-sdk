import log from '../helpers/log'
import { files, scripts } from 'zos'
import { FileSystem as fs, Semver, Contracts } from 'zos-lib'
import validateAddress from '../helpers/validateAddress'
import {
  VOUCHING_MIN_STAKE,
  ZEPPELIN_ORG_NAME,
  ZEPTOKEN_NAME,
  ZEPTOKEN_SUPPLY,
  ZEPTOKEN_SYMBOL,
  ZEPTOKEN_DECIMALS,
  ZEPTOKEN_ATTRIBUTE_ID,
  ZEPTOKEN_ATTRIBUTE_DESCRIPTION,
} from '../constants'

const { status } = scripts
const { ZosPackageFile } = files

export default async function verify({ network, txParams }) {
  log.info(`Verifying vouching app on network ${ network }...`)
  const networkFile = (new ZosPackageFile()).networkFile(network)
  const successfulApp = await verifyAppSetup(networkFile)
  const successfulJurisdiction = successfulApp && await verifyJurisdiction(networkFile, txParams)
  const successfulZepToken = successfulJurisdiction && await verifyZEPToken(networkFile, txParams)
  const successfulVouching = successfulZepToken && await verifyVouching(networkFile, txParams)
  const successfulValidator = successfulVouching && await verifyZEPValidator(networkFile, txParams)
  const successfulConfiguration = successfulValidator && await verifyTPLConfiguration(networkFile, txParams)
  if (successfulConfiguration) log.info('\n\nVouching app was deployed and configured successfully!')
  else log.error('\n\nCould not complete verification process since there are required previous steps not completed.')
}

export async function verifyAppSetup(networkFile) {
  log.base('\n--------------------------------------------------------------------\n')
  log.base('Verifying ZeppelinOS app...')

  if (fs.exists(networkFile.fileName)) {
    const validAppAddress = validateAddress(networkFile.appAddress)
    const validPackageAddress = validateAddress(networkFile.packageAddress)
    const validVersion = networkFile.version && networkFile.version !== ''

    validAppAddress
      ? log.info (' ✔ App address is valid')
      : log.error(` ✘ App address ${networkFile.appAddress} is not valid`)

    validPackageAddress
      ? log.info (' ✔ Package address is valid')
      : log.error(` ✘ Package address ${networkFile.packageAddress} is not valid`)

    validVersion
      ? log.info (' ✔ Version name is valid')
      : log.error(` ✘ Version name "${networkFile.version}" is not valid`)

    if (validAppAddress && validPackageAddress && validVersion) {
      const App = Contracts.getFromNodeModules('zos-lib', 'App')
      const app = App.at(networkFile.appAddress)
      const [packageAddress, version] = await app.getPackage('zos-vouching')
      const registeredPackage = packageAddress === networkFile.packageAddress
      const registeredVersion = Semver.semanticVersionEqual(version, networkFile.version)

      registeredPackage
        ? log.info (' ✔ Package address is registered on the app')
        : log.error(` ✘ Package address ${networkFile.packageAddress} is not registered on the app ${networkFile.appAddress}`)

      registeredVersion
        ? log.info (' ✔ Requested version is registered on-chain')
        : log.error(` ✘ Requested version ${networkFile.version} is not registered on-chain, it was expected ${version}`)

      return registeredPackage && registeredVersion
    }
    else return false
  }
  else {
    log.error(` ✘ Cannot find ZeppelinOS ${networkFile.network} file.`)
    return false
  }
}

export async function verifyJurisdiction(networkFile, txParams) {
  log.base('\n--------------------------------------------------------------------\n')
  log.base('Verifying basic jurisdiction...')

  const jurisdictionProxies = networkFile._proxiesOf('tpl-contracts-zos/BasicJurisdiction')
  if (jurisdictionProxies.length > 0) {
    const jurisdictionAddress = jurisdictionProxies[jurisdictionProxies.length - 1].address
    if (validateAddress(jurisdictionAddress)) {
      log.info (' ✔ Jurisdiction address is valid')
      const BasicJurisdiction = Contracts.getFromLocal('BasicJurisdiction')
      const jurisdiction = BasicJurisdiction.at(jurisdictionAddress)
      const jurisdictionOwner = await jurisdiction.owner()
      const ownerMatches = jurisdictionOwner === txParams.from
      ownerMatches
        ? log.info (' ✔ Jurisdiction owner matches requested owner')
        : log.error(` ✘ Jurisdiction owner ${jurisdictionOwner} does not match requested owner, it was expected ${txParams.from}`)
      return ownerMatches
    }
    else {
      log.error(` ✘ BasicJurisdiction instance address ${jurisdictionAddress} is not valid`)
      return false
    }
  } 
  else {
    log.error(' ✘ Missing instance of BasicJurisdiction')
    return false
  }
}

export async function verifyZEPToken(networkFile, txParams) {
  log.base('\n--------------------------------------------------------------------\n')
  log.base('Verifying ZEP Token...')

  const zepTokenProxies = networkFile._proxiesOf('zos-vouching/ZEPToken')
  if (zepTokenProxies.length > 0) {
    const zepTokenAddress = zepTokenProxies[zepTokenProxies.length - 1].address
    if (validateAddress(zepTokenAddress)) {
      log.info (' ✔ ZEP Token address is valid')
      const ZEPToken = Contracts.getFromLocal('ZEPToken')
      const zepToken = ZEPToken.at(zepTokenAddress)
      const name = await zepToken.name()
      const symbol = await zepToken.symbol()
      const decimals = await zepToken.decimals()
      const totalSupply = await zepToken.totalSupply()

      const isPauser = await zepToken.isPauser(txParams.from)
      const nameMatches = name === ZEPTOKEN_NAME
      const symbolMatches = symbol === ZEPTOKEN_SYMBOL
      const decimalsMatches = decimals.eq(ZEPTOKEN_DECIMALS)
      const totalSupplyMatches = totalSupply.eq(new web3.BigNumber(`${ZEPTOKEN_SUPPLY}e${decimals}`))

      isPauser
        ? log.info (' ✔ ZEP Token deployer has pauser role')
        : log.error(` ✘ ZEP Token deployer ${txParams.from} does not have pauser role`)

      nameMatches
        ? log.info (' ✔ ZEP Token name matches requested value')
        : log.error(` ✘ ZEP Token name "${name}" does not match expected value "${ZEPTOKEN_NAME}"`)
      
      symbolMatches
        ? log.info (' ✔ ZEP Token symbol matches requested value')
        : log.error(` ✘ ZEP Token symbol "${symbol}" does not match expected value "${ZEPTOKEN_SYMBOL}"`)
      
      decimalsMatches
        ? log.info (' ✔ ZEP Token decimals matches the requested value')
        : log.error(` ✘ ZEP Token decimals ${decimals} does not match expected value ${ZEPTOKEN_DECIMALS}`)
      
      totalSupplyMatches
        ? log.info (' ✔ ZEP Token total supply matches the requested value')
        : log.error(` ✘ ZEP Token total supply ${totalSupply} does not match expected value ${ZEPTOKEN_SUPPLY}`)
      
      return isPauser && nameMatches && symbolMatches && decimalsMatches && totalSupplyMatches
    }
    else {
      log.error(` ✘ ZEP Token instance address ${zepTokenAddress} is not valid`)
      return false
    }
  }
  else {
    log.error(' ✘ Missing instance of ZEP Token')
    return false
  }
}

export async function verifyVouching(networkFile, txParams) {
  log.base('\n--------------------------------------------------------------------\n')
  log.base('Verifying Vouching contract...')

  const zepTokenProxies = networkFile._proxiesOf('zos-vouching/ZEPToken')
  const zepTokenAddress = zepTokenProxies[zepTokenProxies.length - 1].address
  const vouchingProxies = networkFile._proxiesOf('zos-vouching/Vouching')
  if (vouchingProxies.length > 0) {
    const vouchingAddress = vouchingProxies[vouchingProxies.length - 1].address
    if (validateAddress(vouchingAddress)) {
      log.info (' ✔ Vouching address is valid')
      const Vouching = Contracts.getFromLocal('Vouching')
      const vouching = Vouching.at(vouchingAddress)
      const token = await vouching.token()
      const minimumStake = await vouching.minimumStake()
      
      const tokenMatches = token === zepTokenAddress
      const minimumStakeMatches = minimumStake.eq(VOUCHING_MIN_STAKE)

      tokenMatches
        ? log.info (' ✔ Vouching token matches ZEP Token deployed instance')
        : log.error(` ✘ Vouching token ${token} does not match ZEP Token deployed instance ${zepTokenAddress}`)

      minimumStakeMatches
        ? log.info (' ✔ Vouching minimum stake matches requested value')
        : log.error(` ✘ Vouching minimum stake ${minimumStake} does not match requested value, it was expected ${VOUCHING_MIN_STAKE}`)

      return tokenMatches && minimumStakeMatches
    }
    else {
      log.error(` ✘ Vouching address ${vouchingAddress} is not valid`)
      return false
    }
  }
  else {
    log.error(' ✘ Missing instance of Vouching')
    return false
  }
}

export async function verifyZEPValidator(networkFile, txParams) {
  log.base('\n--------------------------------------------------------------------\n')
  log.base('Verifying ZEP validator...')

  const jurisdictionProxies = networkFile._proxiesOf('tpl-contracts-zos/BasicJurisdiction')
  const jurisdictionAddress = jurisdictionProxies[jurisdictionProxies.length - 1].address
  const validatorProxies = networkFile._proxiesOf('zos-vouching/ZEPValidator')
  if (validatorProxies.length > 0) {
    const validatorAddress = validatorProxies[validatorProxies.length - 1].address
    if (validateAddress(validatorAddress)) {
      log.info (' ✔ ZEP validator address is valid')
      const ZEPValidator = Contracts.getFromLocal('ZEPValidator')
      const validator = ZEPValidator.at(validatorAddress)
      const owner = await validator.owner()
      const jurisdiction = await validator.getJurisdictionAddress()

      const ownerMatches = owner === txParams.from
      const jurisdictionMatches = jurisdiction === jurisdictionAddress

      ownerMatches
        ? log.info (' ✔ ZEP validator owner matches requested value')
        : log.error(` ✘ ZEP validator owner ${owner} does not match requested value, it was expected ${txParams.from}`)

      jurisdictionMatches
        ? log.info (' ✔ ZEP validator jurisdiction matches BasicJurisdiction deployed instance')
        : log.error(` ✘ ZEP validator jurisdiction ${jurisdiction} does not match BasicJurisdiction deployed instance ${jurisdictionAddress}`)

      return ownerMatches && jurisdictionMatches
    }
    else {
      log.error(` ✘ ZEP validator address ${validatorAddress} is not valid`)
      return false
    }
  }
  else {
    log.error(' ✘ Missing instance of ZEPValidator')
    return false
  }
}

export async function verifyTPLConfiguration(networkFile, txParams) {
  log.base('\n--------------------------------------------------------------------\n')
  log.base('Verifying TPL configuration...')

  const BasicJurisdiction = Contracts.getFromLocal('BasicJurisdiction')
  const jurisdictionProxies = networkFile._proxiesOf('tpl-contracts-zos/BasicJurisdiction')
  const jurisdictionAddress = jurisdictionProxies[jurisdictionProxies.length - 1].address
  const jurisdiction = BasicJurisdiction.at(jurisdictionAddress)

  const ZEPValdiator = Contracts.getFromLocal('ZEPValidator')
  const validatorProxies = networkFile._proxiesOf('zos-vouching/ZEPValidator')
  const validatorAddress = validatorProxies[validatorProxies.length - 1].address
  const validator = ZEPValdiator.at(validatorAddress)

  const [description] = await jurisdiction.getAttributeInformation(ZEPTOKEN_ATTRIBUTE_ID)
  const [exists, _, name] = await validator.getOrganization(txParams.from)

  const descriptionMatches = description === ZEPTOKEN_ATTRIBUTE_DESCRIPTION
  const isValidator = await jurisdiction.isValidator(validatorAddress)
  const canValidate = await jurisdiction.isApproved(validatorAddress, ZEPTOKEN_ATTRIBUTE_ID)
  const organizationMatches = exists && name === ZEPPELIN_ORG_NAME

  descriptionMatches
    ? log.info (` ✔ Jurisdiction attribute description matches requested value`)
    : log.error(` ✘ Jurisdiction attribute description "${description}" does not match requested value, it was expected "${ZEPTOKEN_ATTRIBUTE_DESCRIPTION}"`)

  isValidator
    ? log.info (' ✔ ZEP Validator is correctly set as a validator on the jurisdiction')
    : log.error(` ✘ ZEP Validator ${validatorAddress} is not set as a validator on the jurisdiction ${jurisdictionAddress}`)

  canValidate
    ? log.info (' ✔ ZEP Validator is cleared for approval of ZEP Token attribute ID on the jurisdiction')
    : log.error(` ✘ ZEP Validator ${validatorAddress} is not cleared for approval of ZEP Token attribute ID ${ZEPTOKEN_ATTRIBUTE_ID} on the jurisdiction ${jurisdictionAddress}`)

  organizationMatches
    ? log.info (' ✔ Zeppelin organization was properly set in the ZEP validator')
    : log.error(` ✘ Zeppelin organization "${ZEPPELIN_ORG_NAME}" is not set in the ZEP Validator`)

  return descriptionMatches && isValidator && canValidate && organizationMatches
}
