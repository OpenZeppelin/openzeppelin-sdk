'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// zOS commands.


// zOS utils.


var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

var _status = require('zos/lib/scripts/status');

var _status2 = _interopRequireDefault(_status);

var _zosLib = require('zos-lib');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Enable zOS logging.
_zosLib.Logger.silent(false);

// zos.<network>.json
let networkData;
let jurisdictionAddress;
let zepTokenAddress;

// *****************
// COMBINED
// *****************

exports.default = async function validate(options) {
  console.log(_colors2.default.cyan(`validating vouching app on network ${options.network}`).inverse);

  // Retrieve network data.
  networkData = require(`../../zos.${options.network}.json`);

  await printStatus(options);
  // TODO: check if app was pushed?
  await checkJurisdiction(options);
  await checkZEPToken(options);
  await checkVouching(options);
  await checkZEPValidator(options);

  console.log(_colors2.default.cyan(`vouching app looks good!!`).inverse);
};

async function printStatus(options) {
  console.log(_colors2.default.gray(`printing app status`).inverse);

  // Run script.
  await (0, _status2.default)(_extends({}, options));
}

// *****************
// JURISDICTION
// *****************

async function checkJurisdiction(options) {
  console.log(_colors2.default.gray(`validating jurisdiction`).inverse);

  // Find instance.
  const proxies = networkData.proxies['tpl-contracts-zos/BasicJurisdiction'];
  if (proxies.length === 0) throw new Error('Instance for BasicJurisdiction not created!');
  console.log(`proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];

  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  jurisdictionAddress = proxyAddress; // Used for upcoming tests beyond the scope of this test.
  if (!validateAddress(proxyAddress)) throw new Error('Invalid BasicJurisdiction instance address.');
  console.log(`BasicJurisdiction instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const BasicJurisdiction = _zosLib.Contracts.getFromLocal('BasicJurisdiction');
  const contract = BasicJurisdiction.at(proxyAddress);

  // Jurisdiction owner is the specified address.
  const owner = await contract.owner();
  console.log(`BasicJurisdiction owner: ${owner}`);
  if (owner != options.txParams.from) throw new Error('Unexpected BasicJurisdiction owner!');

  // TODO: consider performing addition tests for jurisdiction, i.e. checking interface, etc

  console.log(_colors2.default.gray(`jurisdiction looks good!!`).inverse);
}

// *****************
// ZEPToken
// *****************

async function checkZEPToken(options) {
  console.log(_colors2.default.gray(`validating ZEPToken`).inverse);

  // Find instance.
  const proxies = networkData.proxies['zos-vouching/ZEPToken'];
  if (proxies.length === 0) throw new Error('Instance for ZEPToken not created!');
  console.log(`proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];

  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  zepTokenAddress = proxyAddress; // Used for upcoming tests beyond the scope of this test.
  if (!validateAddress(proxyAddress)) throw new Error('Invalid ZEPToken instance address.');
  console.log(`ZEPToken instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const ZEPToken = _zosLib.Contracts.getFromLocal('ZEPToken');
  const contract = ZEPToken.at(proxyAddress);

  // Verify that the token name is correct.
  const name = await contract.name();
  console.log(`ZEPToken name: ${name}`);
  if (name != 'ZeppelinOS Token') throw new Error('Invalid ZEPToken name.');

  // Verify that the token symbol is correct.
  const symbol = await contract.symbol();
  console.log(`ZEPToken symbol: ${symbol}`);
  if (symbol != 'ZEP') throw new Error('Invalid ZEPToken symbol.');

  // TODO: more tests?

  console.log(_colors2.default.gray(`ZEPToken looks good!!`).inverse);
}

// *****************
// Vouching
// *****************

async function checkVouching(options) {
  console.log(_colors2.default.gray(`validating Vouching`).inverse);

  // Find instance.
  const proxies = networkData.proxies['zos-vouching/Vouching'];
  if (proxies.length === 0) throw new Error('Instance for Vouching not created!');
  console.log(`proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];

  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  if (!validateAddress(proxyAddress)) throw new Error('Invalid Vouching instance address.');
  console.log(`Vouching instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const Vouching = _zosLib.Contracts.getFromLocal('Vouching');
  const contract = Vouching.at(proxyAddress);

  // Check that the token is set correctly.
  const token = await contract.token();
  console.log(`Vouching token address: ${token}`);
  if (token != zepTokenAddress) throw new Error('Invalid token set for Vouching instance.');

  // TODO: more tests?

  console.log(_colors2.default.gray(`Vouching looks good!!`).inverse);
}

// *****************
// ZEPValidator
// *****************

async function checkZEPValidator(options) {
  console.log(_colors2.default.gray(`validating ZEPValidator`).inverse);

  // Find instance.
  const proxies = networkData.proxies['zos-vouching/ZEPValidator'];
  if (proxies.length === 0) throw new Error('Instance for ZEPValidator not created!');
  console.log(`proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];

  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  if (!validateAddress(proxyAddress)) throw new Error('Invalid ZEPValidator instance address.');
  console.log(`ZEPValidator instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const ZEPValidator = _zosLib.Contracts.getFromLocal('ZEPValidator');
  const contract = ZEPValidator.at(proxyAddress);

  // Check that the jurisdiction is set correctly.
  const jurisdiction = await contract.getJurisdictionAddress();
  console.log(`ZEPValidator jurisdiction address: ${jurisdiction}`);
  if (jurisdiction != jurisdictionAddress) throw new Error('Invalid jurisdiction set for ZEPValidaotr instance.');

  // TODO: more tests?

  console.log(_colors2.default.gray(`Vouching looks good!!`).inverse);
}

// *****************
// UTILS
// *****************

function validateAddress(address) {
  if (!address) return false;
  if (address === '0x0000000000000000000000000000000000000000') return false;
  if (address.substring(0, 2) !== "0x") return false;

  // Basic validation: length, valid characters, etc
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) return false;

  // Checksum validation.
  const raw = address.replace('0x', '');
  const allLowerCase = raw.toLowerCase() === raw;
  const allUppercase = raw.toUpperCase() === raw;
  if (allLowerCase || allUppercase) {
    return true; // accepts addreses with no checksum data
  } else {
    const checksum = ethjs.toChecksumAddress(address);
    if (address !== checksum) return false;
  }

  return true;
}