import colors from 'colors';
import fs from 'fs';
import * as constants from './constants';

// zOS commands.
import status from 'zos/lib/scripts/status';

// zOS utils.
import { Logger, Contracts } from 'zos-lib';

// Enable zOS logging.
Logger.silent(false);

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
  console.log(colors.cyan(`validating vouching app on network ${ options.network }`).inverse);

  // Retrieve network data.
  networkData = require(`../../zos.${options.network}.json`);

  await printStatus(options);
  await checkApp(options);
  await checkJurisdiction(options);
  await checkZEPToken(options);
  await checkVouching(options);
  await checkZEPValidator(options);
  await checkConfig(options);

  console.log(colors.green(`vouching app looks good!!`).inverse);
}

async function printStatus(options) {
  console.log(colors.gray(`printing app status`).inverse);
  
  // Run script.
  await status({
    ...options
  });
}

// *****************
// App
// *****************

async function checkApp(options) {
  console.log(colors.gray(`validating app`).inverse);

  // Check that the network file exists.
  const zosFilePath = `./zos.${options.network}.json`;
  if(!fs.existsSync(zosFilePath)) throw new Error('Network file for app not found.');

  // Check that the network file has a valid app address.
  const appAddress = networkData.app['address'];
  if(!validateAddress(appAddress)) throw new Error('Invalid app address.');

  // Check that the network file has a valid package address.
  const packageAddress = networkData.package['address'];
  if(!validateAddress(packageAddress)) throw new Error('Invalid package address.');
  
  // Check for a valid local version.
  const localVersion = networkData.version;
  if(!localVersion || localVersion === '') throw new Error('Invalid app version');
  
  // Verify that the onchain version matches the local version.
  const App = Contracts.getFromNodeModules('zos-lib', 'App');
  const appContract = App.at(appAddress);
  const Package = Contracts.getFromNodeModules('zos-lib', 'Package');
  const packageContract = Package.at(packageAddress);
  const versionMatch = await packageContract.hasVersion(localVersion.split('.'));
  if(!versionMatch) throw new Error('Invalid onchain app version');

  console.log(colors.cyan(`app looks good!!`).inverse);
}

// *****************
// Jurisdiction
// *****************

async function checkJurisdiction(options) {
  console.log(colors.gray(`validating jurisdiction`).inverse);

  // Find instance.
  const proxies = networkData.proxies['tpl-contracts-zos/BasicJurisdiction'];
  if(proxies.length === 0) throw new Error('Instance for BasicJurisdiction not created!');
  console.log(`proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];

  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  jurisdictionAddress = proxyAddress; // Used for upcoming tests beyond the scope of this test.
  if(!validateAddress(proxyAddress)) throw new Error('Invalid BasicJurisdiction instance address.');
  console.log(`BasicJurisdiction instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const BasicJurisdiction = Contracts.getFromLocal('BasicJurisdiction');
  jurisdictionContract = BasicJurisdiction.at(proxyAddress);

  // Jurisdiction owner is the specified address.
  const owner = await jurisdictionContract.owner(); 
  console.log(`BasicJurisdiction owner: ${owner}`);
  if(owner != options.txParams.from) throw new Error('Unexpected BasicJurisdiction owner!');

  // TODO: consider performing addition tests for jurisdiction, i.e. checking interface, etc

  console.log(colors.cyan(`jurisdiction looks good!!`).inverse);
}

// *****************
// ZEPToken
// *****************

async function checkZEPToken(options) {
  console.log(colors.gray(`validating ZEPToken`).inverse);

  // Find instance.
  const proxies = networkData.proxies['zos-vouching/ZEPToken'];
  if(proxies.length === 0) throw new Error('Instance for ZEPToken not created!');
  console.log(`proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];

  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  zepTokenAddress = proxyAddress; // Used for upcoming tests beyond the scope of this test.
  if(!validateAddress(proxyAddress)) throw new Error('Invalid ZEPToken instance address.');
  console.log(`ZEPToken instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const ZEPToken = Contracts.getFromLocal('ZEPToken');
  const contract = ZEPToken.at(proxyAddress);

  // Verify that the token name is correct.
  const name = await contract.name();
  console.log(`ZEPToken name: ${name}`);
  if(name != constants.ZEPTOKEN_NAME) throw new Error('Invalid ZEPToken name.');
  
  // Verify that the token symbol is correct.
  const symbol = await contract.symbol();
  console.log(`ZEPToken symbol: ${symbol}`);
  if(symbol != constants.ZEPTOKEN_SYMBOL) throw new Error('Invalid ZEPToken symbol.');

  // TODO: more tests?

  console.log(colors.cyan(`ZEPToken looks good!!`).inverse);
}

// *****************
// Vouching
// *****************

async function checkVouching(options) {
  console.log(colors.gray(`validating Vouching`).inverse);

  // Find instance.
  const proxies = networkData.proxies['zos-vouching/Vouching'];
  if(proxies.length === 0) throw new Error('Instance for Vouching not created!');
  console.log(`proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];

  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  if(!validateAddress(proxyAddress)) throw new Error('Invalid Vouching instance address.');
  console.log(`Vouching instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const Vouching = Contracts.getFromLocal('Vouching');
  const contract = Vouching.at(proxyAddress);

  // Check that the token is set correctly.
  const token = await contract.token();
  console.log(`Vouching token address: ${token}`);
  if(token != zepTokenAddress) throw new Error('Invalid token set for Vouching instance.');

  // TODO: more tests?

  console.log(colors.cyan(`vouching looks good!!`).inverse);
}

// *****************
// ZEPValidator
// *****************

async function checkZEPValidator(options) {
  console.log(colors.gray(`validating ZEPValidator`).inverse);

  // Find instance.
  const proxies = networkData.proxies['zos-vouching/ZEPValidator'];
  if(proxies.length === 0) throw new Error('Instance for ZEPValidator not created!');
  console.log(`proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];

  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  zepValidatorAddress = proxyAddress; // Used for upcoming tests beyond the scope of this test.
  if(!validateAddress(proxyAddress)) throw new Error('Invalid ZEPValidator instance address.');
  console.log(`ZEPValidator instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const ZEPValidator = Contracts.getFromLocal('ZEPValidator');
  const contract = ZEPValidator.at(proxyAddress);
  zepValidatorContract = contract; // Used for upcoming tests beyond the scope of this test.

  // Jurisdiction owner is the specified address.
  const owner = await contract.owner(); 
  console.log(`ZEPValidator owner: ${owner}`);
  if(owner != options.txParams.from) throw new Error('Unexpected ZEPValidator owner!');

  // Check that the jurisdiction is set correctly.
  const jurisdiction = await contract.getJurisdictionAddress();
  console.log(`ZEPValidator jurisdiction address: ${jurisdiction}`);
  if(jurisdiction != jurisdictionAddress) throw new Error('Invalid jurisdiction set for ZEPValidaotr instance.');

  // TODO: more tests?

  console.log(colors.cyan(`ZEPValidator looks good!!`).inverse);
}

// *****************
// TPL Config
// *****************

async function checkConfig(options) {
  console.log(colors.gray(`validating TPL configuration`).inverse);

  // Jurisdiction has the ZEPToken attribute type set.
  const attrInfo = await jurisdictionContract.getAttributeInformation(constants.ZEPTOKEN_ATTRIBUTE_ID);
  const description = attrInfo[0];
  console.log(`Jurisdiction attribute description for id ${constants.ZEPTOKEN_ATTRIBUTE_ID}: ${description}`);
  if(!description || description !== constants.ZEPTOKEN_ATTRIBUTE_DESCRIPTION) throw new Error('ZEPToken attribute is incorrectly set on the jurisdiction.');
  console.log(`ZEPToken attribute is correctly set on the jurisdiction.`);

  // Check that the validator is correctly set on the jurisdiction.
  const isValidator = jurisdictionContract.isValidator(zepValidatorAddress);
  if(!isValidator) throw new Error('ZEPValidator is not set as a validator on the jurisdiction.');
  console.log(`ZEPValidator is correctly set as a validator on the jurisdiction.`);
  
  // Verify that ZEPValidator can verify ZEPToken's attribute id.
  const canValidate = await jurisdictionContract.isApproved(zepValidatorContract.address, constants.ZEPTOKEN_ATTRIBUTE_ID);
  if(!canValidate) throw new Error(`ZEPValidator is not cleared for approval of ZEPToken attribute id: ${constants.ZEPTOKEN_ATTRIBUTE_ID}`);
  console.log(`ZEPValidator is cleared for approval of ZEPToken attribute id: ${constants.ZEPTOKEN_ATTRIBUTE_ID}`);

  // Verify that ZEPValidator is added as an organization in the jurisdiction.
  const owner = await  zepValidatorContract.owner(); 
  const orgInfo = await zepValidatorContract.getOrganization(owner);
  const exists = orgInfo[0];
  const name = orgInfo[2];
  if(!exists || name !== constants.ZEPPELIN_ORG_NAME) throw new Error(`${constants.ZEPPELIN_ORG_NAME} is not set as an organization in the validator.`);
  console.log(`${constants.ZEPPELIN_ORG_NAME} correctly set as an organization in ZEPValidator.`);

  console.log(colors.cyan(`TPL configuration looks good!!`).inverse);
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
