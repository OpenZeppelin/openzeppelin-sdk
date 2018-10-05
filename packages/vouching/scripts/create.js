import colors from 'colors';

// zOS commands.
import createProxy from '../node_modules/zos/lib/scripts/create';

// Enable zOS logging.
import { Logger } from 'zos-lib';
Logger.silent(false);

export default async function create(options) {
  console.log(colors.cyan(`creating instances with options ${ JSON.stringify(options, null, 2) }`).inverse);

  // Instantiate BasicJurisdiction.initialize(address owner).
  const basicJurisdictionProxy = await createBasicJurisdictionInstance(options.txParams.from, options);

  // Instantiate ZEPToken.initialize(address basicJurisdiction, uint256 attributeID).
  const attributeID = '1665201538125898990930';
  const zepTokenProxy = await createZEPTokenInstance(basicJurisdictionProxy.address, attributeID, options);
  
  // Instantiate Vouching.initialize(uint267 minimumStake, address zepTokenAddress).
  const minimumStake = 10;
  const vouchingProxy = await createVouchingInstance(minimumStake, zepTokenProxy.address, options);
  
  // Instantiate ZEPValidator.initialize(basicJurisdictionAddress, attributeID).
  const zepValidatorProxy = await createZEPValidatorInstance(basicJurisdictionProxy.address, attributeID, options);

  console.log(colors.cyan(`all instances created!!`).inverse);
}

async function createBasicJurisdictionInstance(owner, options) {
  console.log(colors.gray(`creating instance for BasicJurisdiction with owner: ${owner}`).inverse);
  
  // Run script.
  const proxy = await createProxy({
    packageName: 'tpl-contracts-zos',
    contractAlias: 'BasicJurisdiction',
    initMethod: 'initialize',
    initArgs: [owner],
    ...options
  });

  console.log(colors.gray(`BasicJurisdiction instance created at: ${proxy.address}`).inverse);

  return proxy;
}

async function createZEPTokenInstance(basicJurisdictionAddress, attributeID, options) {
  console.log(colors.gray(`creating instance for ZEPToken with basicJurisdictionAddress: ${basicJurisdictionAddress} and attributeID: ${attributeID}`).inverse);
  
  // Run script.
  const proxy = await createProxy({
    packageName: 'zos-vouching',
    contractAlias: 'ZEPToken',
    initMethod: 'initialize',
    initArgs: [basicJurisdictionAddress, attributeID],
    ...options
  });

  console.log(colors.gray(`ZEPToken instance created at: ${proxy.address}`).inverse);

  return proxy;
}

async function createVouchingInstance(minimumStake, zepTokenAddress, options) {
  console.log(colors.gray(`creating instance for Vouching with minimumStake: ${minimumStake} and zepTokenAddress: ${zepTokenAddress}`).inverse);
  
  // Run script.
  const proxy = await createProxy({
    packageName: 'zos-vouching',
    contractAlias: 'Vouching',
    initMethod: 'initialize',
    initArgs: [minimumStake, zepTokenAddress],
    ...options
  });

  console.log(colors.gray(`Vouching instance created at: ${proxy.address}`).inverse);

  return proxy;
}

async function createZEPValidatorInstance(basicJurisdictionAddress, attributeID, options) {
  console.log(colors.gray(`creating instance for ZEPValidator with basicJurisdictionAddress: ${basicJurisdictionAddress} and attributeID: ${attributeID}`).inverse);
  
  // Run script.
  const proxy = await createProxy({
    packageName: 'zos-vouching',
    contractAlias: 'ZEPValidator',
    initMethod: 'initialize',
    initArgs: [basicJurisdictionAddress, attributeID],
    ...options
  });

  console.log(colors.gray(`ZEPValidator instance created at: ${proxy.address}`).inverse);

  return proxy;
}
