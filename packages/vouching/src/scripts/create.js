import * as constants from './constants'

// zOS commands.
import createProxy from 'zos/lib/scripts/create';

export default async function create(options) {
  log.info(`creating instances with options ${ JSON.stringify(options, null, 2) }`)

  const owner = options.txParams.from;

  // Instantiate BasicJurisdiction.initialize(address owner).
  const basicJurisdictionProxy = await createBasicJurisdictionInstance(owner, options);

  // Instantiate ZEPToken.initialize(address owner, address basicJurisdiction, uint256 attributeID).
  const attributeID = constants.ZEPTOKEN_ATTRIBUTE_ID;
  const zepTokenProxy = await createZEPTokenInstance(owner, basicJurisdictionProxy.address, attributeID, options);
  
  // Instantiate Vouching.initialize(uint267 minimumStake, address zepTokenAddress).
  const minimumStake = constants.VOUCHING_MIN_STAKE;
  const vouchingProxy = await createVouchingInstance(minimumStake, zepTokenProxy.address, options);
  
  // Instantiate ZEPValidator.initialize(ownerAddress, basicJurisdictionAddress, attributeID).
  const zepValidatorProxy = await createZEPValidatorInstance(owner, basicJurisdictionProxy.address, attributeID, options);

  log.info(`all instances created`)
}

async function createBasicJurisdictionInstance(owner, options) {
  log.base(`creating instance for BasicJurisdiction with owner: ${owner}`)
  
  // Run script.
  const proxy = await createProxy({
    packageName: 'tpl-contracts-zos',
    contractAlias: 'BasicJurisdiction',
    initMethod: 'initialize',
    initArgs: [owner],
    ...options
  });

  log.base(`BasicJurisdiction instance created at: ${proxy.address}`)

  return proxy;
}

async function createZEPTokenInstance(owner, basicJurisdictionAddress, attributeID, options) {
  log.base(`creating instance for ZEPToken with owner: ${owner} basicJurisdictionAddress: ${basicJurisdictionAddress} and attributeID: ${attributeID}`)
  
  // Run script.
  const proxy = await createProxy({
    packageName: 'zos-vouching',
    contractAlias: 'ZEPToken',
    initMethod: 'initialize',
    initArgs: [owner, basicJurisdictionAddress, attributeID],
    ...options
  });

  log.base(`ZEPToken instance created at: ${proxy.address}`)

  return proxy;
}

async function createVouchingInstance(minimumStake, zepTokenAddress, options) {
  log.base(`creating instance for Vouching with minimumStake: ${minimumStake} and zepTokenAddress: ${zepTokenAddress}`)
  
  // Run script.
  const proxy = await createProxy({
    packageName: 'zos-vouching',
    contractAlias: 'Vouching',
    initMethod: 'initialize',
    initArgs: [minimumStake, zepTokenAddress],
    ...options
  });

  log.base(`Vouching instance created at: ${proxy.address}`)

  return proxy;
}

async function createZEPValidatorInstance(owner, basicJurisdictionAddress, attributeID, options) {
  log.base(`creating instance for ZEPValidator with owner: ${owner} basicJurisdictionAddress: ${basicJurisdictionAddress} and attributeID: ${attributeID}`)
  
  // Run script.
  const proxy = await createProxy({
    packageName: 'zos-vouching',
    contractAlias: 'ZEPValidator',
    initMethod: 'initialize',
    initArgs: [owner, basicJurisdictionAddress, attributeID],
    ...options
  });

  log.base(`ZEPValidator instance created at: ${proxy.address}`)

  return proxy;
}
