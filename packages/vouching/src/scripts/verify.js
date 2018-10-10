import fs from 'fs'
import * as constants from './constants'

// zOS commands.
import status from 'zos/lib/scripts/status';

// zOS utils.
import { Contracts } from 'zos-lib';

// zos.<network>.json
let networkData;
let jurisdictionAddress;
let zepTokenAddress;
let jurisdictionContract;
let zepValidatorAddress;
let zepValidatorContract;

// *****************
// COMBINED
// *****************

export default async function verify(options) {
  log.info(`validating vouching app on network ${ options.network }`)

  // Retrieve network data.
  networkData = require(`../../zos.${options.network}.json`);

  await printStatus(options);
  await checkApp(options);
  await checkJurisdiction(options);
  await checkZEPToken(options);
  await checkVouching(options);
  await checkZEPValidator(options);
  await checkConfig(options);

  log.info(`vouching app looks good!!`)
}

async function printStatus(options) {
  log.base(`printing app status`)
  
  // Run script.
  await status({
    ...options
  });
}

// *****************
// App
// *****************

async function checkApp(options) {
  log.base(`validating app`)

  // Check that the network file exists.
  const zosFilePath = `./zos.${options.network}.json`;
  if(!fs.existsSync(zosFilePath)) log.error('Network file for app not found.');

  // Check that the network file has a valid app address.
  const appAddress = networkData.app['address'];
  if(!validateAddress(appAddress)) log.error('Invalid app address.');

  // Check that the network file has a valid package address.
  const packageAddress = networkData.package['address'];
  if(!validateAddress(packageAddress)) log.error('Invalid package address.');
  
  // Check for a valid local version.
  const localVersion = networkData.version;
  if(!localVersion || localVersion === '') log.error('Invalid app version');
  
  // Verify that the onchain version matches the local version.
  const App = Contracts.getFromNodeModules('zos-lib', 'App');
  const appContract = App.at(appAddress);
  const Package = Contracts.getFromNodeModules('zos-lib', 'Package');
  const packageContract = Package.at(packageAddress);
  const versionMatch = await packageContract.hasVersion(localVersion.split('.'));
  if(!versionMatch) log.error('Invalid onchain app version');

  log.info(`app looks good!!`)
}

// *****************
// Jurisdiction
// *****************

async function checkJurisdiction(options) {
  log.base(`validating jurisdiction`)

  // Find instance.
  const proxies = networkData.proxies['tpl-contracts-zos/BasicJurisdiction'];
  if(proxies.length === 0) log.error('Instance for BasicJurisdiction not created!');
  log.base(`proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];

  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  jurisdictionAddress = proxyAddress; // Used for upcoming tests beyond the scope of this test.
  if(!validateAddress(proxyAddress)) log.error('Invalid BasicJurisdiction instance address.');
  log.base(`BasicJurisdiction instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const BasicJurisdiction = Contracts.getFromLocal('BasicJurisdiction');
  jurisdictionContract = BasicJurisdiction.at(proxyAddress);

  // Jurisdiction owner is the specified address.
  const owner = await jurisdictionContract.owner();
  log.base(`BasicJurisdiction owner: ${owner}`);
  if(owner != options.txParams.from) log.error('Unexpected BasicJurisdiction owner!');

  // TODO: consider performing addition tests for jurisdiction, i.e. checking interface, etc

  log.info(`jurisdiction looks good!!`)
}

// *****************
// ZEPToken
// *****************

async function checkZEPToken(options) {
  log.base(`validating ZEPToken`)

  // Find instance.
  const proxies = networkData.proxies['zos-vouching/ZEPToken'];
  if(proxies.length === 0) log.error('Instance for ZEPToken not created!');
  log.base(`proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];

  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  zepTokenAddress = proxyAddress; // Used for upcoming tests beyond the scope of this test.
  if(!validateAddress(proxyAddress)) log.error('Invalid ZEPToken instance address.');
  log.base(`ZEPToken instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const ZEPToken = Contracts.getFromLocal('ZEPToken');
  const contract = ZEPToken.at(proxyAddress);

  // Verify that the token name is correct.
  const name = await contract.name();
  log.base(`ZEPToken name: ${name}`);
  if(name != constants.ZEPTOKEN_NAME) log.error('Invalid ZEPToken name.');
  
  // Verify that the token symbol is correct.
  const symbol = await contract.symbol();
  log.base(`ZEPToken symbol: ${symbol}`);
  if(symbol != constants.ZEPTOKEN_SYMBOL) log.error('Invalid ZEPToken symbol.');

  // TODO: more tests?

  log.info(`ZEPToken looks good!!`)
}

// *****************
// Vouching
// *****************

async function checkVouching(options) {
  log.base(`validating Vouching`)

  // Find instance.
  const proxies = networkData.proxies['zos-vouching/Vouching'];
  if(proxies.length === 0) log.error('Instance for Vouching not created!');
  log.base(`proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];

  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  if(!validateAddress(proxyAddress)) log.error('Invalid Vouching instance address.');
  log.base(`Vouching instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const Vouching = Contracts.getFromLocal('Vouching');
  const contract = Vouching.at(proxyAddress);

  // Check that the token is set correctly.
  const token = await contract.token();
  log.base(`Vouching token address: ${token}`);
  if(token != zepTokenAddress) log.error('Invalid token set for Vouching instance.');

  // TODO: more tests?

  log.info(`vouching looks good!!`)
}

// *****************
// ZEPValidator
// *****************

async function checkZEPValidator(options) {
  log.base(`validating ZEPValidator`)

  // Find instance.
  const proxies = networkData.proxies['zos-vouching/ZEPValidator'];
  if(proxies.length === 0) log.error('Instance for ZEPValidator not created!');
  log.base(`proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];

  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  zepValidatorAddress = proxyAddress; // Used for upcoming tests beyond the scope of this test.
  if(!validateAddress(proxyAddress)) log.error('Invalid ZEPValidator instance address.');
  log.base(`ZEPValidator instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const ZEPValidator = Contracts.getFromLocal('ZEPValidator');
  const contract = ZEPValidator.at(proxyAddress);
  zepValidatorContract = contract; // Used for upcoming tests beyond the scope of this test.

  // Jurisdiction owner is the specified address.
  const owner = await contract.owner(); 
  log.base(`ZEPValidator owner: ${owner}`);
  if(owner != options.txParams.from) log.error('Unexpected ZEPValidator owner!');

  // Check that the jurisdiction is set correctly.
  const jurisdiction = await contract.getJurisdictionAddress();
  log.base(`ZEPValidator jurisdiction address: ${jurisdiction}`);
  if(jurisdiction != jurisdictionAddress) log.error('Invalid jurisdiction set for ZEPValidaotr instance.');

  // TODO: more tests?

  log.info(`ZEPValidator looks good!!`)
}

// *****************
// TPL Config
// *****************

async function checkConfig(options) {
  log.base(`validating TPL configuration`)

  // Jurisdiction has the ZEPToken attribute type set.
  const attrInfo = await jurisdictionContract.getAttributeInformation(constants.ZEPTOKEN_ATTRIBUTE_ID);
  const description = attrInfo[0];
  log.base(`Jurisdiction attribute description for id ${constants.ZEPTOKEN_ATTRIBUTE_ID}: ${description}`);
  if(!description || description !== constants.ZEPTOKEN_ATTRIBUTE_DESCRIPTION) log.error('ZEPToken attribute is incorrectly set on the jurisdiction.');
  log.info(`ZEPToken attribute is correctly set on the jurisdiction.`);

  // Check that the validator is correctly set on the jurisdiction.
  const isValidator = jurisdictionContract.isValidator(zepValidatorAddress);
  if(!isValidator) log.error('ZEPValidator is not set as a validator on the jurisdiction.');
  log.info(`ZEPValidator is correctly set as a validator on the jurisdiction.`);
  
  // Verify that ZEPValidator can verify ZEPToken's attribute id.
  const canValidate = await jurisdictionContract.isApproved(zepValidatorContract.address, constants.ZEPTOKEN_ATTRIBUTE_ID);
  if(!canValidate) log.error(`ZEPValidator is not cleared for approval of ZEPToken attribute id: ${constants.ZEPTOKEN_ATTRIBUTE_ID}`);
  log.info(`ZEPValidator is cleared for approval of ZEPToken attribute id: ${constants.ZEPTOKEN_ATTRIBUTE_ID}`);

  // Verify that ZEPValidator is added as an organization in the jurisdiction.
  const owner = await  zepValidatorContract.owner(); 
  const orgInfo = await zepValidatorContract.getOrganization(owner);
  const exists = orgInfo[0];
  const name = orgInfo[2];
  if(!exists || name !== constants.ZEPPELIN_ORG_NAME) log.error(`${constants.ZEPPELIN_ORG_NAME} is not set as an organization in the validator.`);
  log.info(`${constants.ZEPPELIN_ORG_NAME} correctly set as an organization in ZEPValidator.`);

  log.info(`TPL configuration looks good!!`)
}

// *****************
// UTILS
// *****************

function validateAddress(address) {
  if(!address) return false;
  if(address === '0x0000000000000000000000000000000000000000') return false;
  if(address.substring(0, 2) !== "0x") return false;

  // Basic validation: length, valid characters, etc
  if(!/^(0x)?[0-9a-f]{40}$/i.test(address)) return false;

  // Checksum validation.
  const raw = address.replace('0x','');
  const allLowerCase = raw.toLowerCase() === raw;
  const allUppercase = raw.toUpperCase() === raw;
  if(allLowerCase || allUppercase) {
    return true; // accepts addreses with no checksum data
  }
  else {
    const checksum = ethjs.toChecksumAddress(address);
    if(address !== checksum) return false;
  }

  return true;
}
