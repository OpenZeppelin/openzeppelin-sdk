'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// zOS commands.


// Enable zOS logging.


var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

var _create = require('zos/lib/scripts/create');

var _create2 = _interopRequireDefault(_create);

var _zosLib = require('zos-lib');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_zosLib.Logger.silent(false);

exports.default = async function create(options) {
  console.log(_colors2.default.cyan(`creating instances with options ${JSON.stringify(options, null, 2)}`).inverse);

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

  console.log(_colors2.default.cyan(`all instances created!!`).inverse);
};

async function createBasicJurisdictionInstance(owner, options) {
  console.log(_colors2.default.gray(`creating instance for BasicJurisdiction with owner: ${owner}`).inverse);

  // Run script.
  const proxy = await (0, _create2.default)(_extends({
    packageName: 'tpl-contracts-zos',
    contractAlias: 'BasicJurisdiction',
    initMethod: 'initialize',
    initArgs: [owner]
  }, options));

  console.log(_colors2.default.gray(`BasicJurisdiction instance created at: ${proxy.address}`).inverse);

  return proxy;
}

async function createZEPTokenInstance(basicJurisdictionAddress, attributeID, options) {
  console.log(_colors2.default.gray(`creating instance for ZEPToken with basicJurisdictionAddress: ${basicJurisdictionAddress} and attributeID: ${attributeID}`).inverse);

  // Run script.
  const proxy = await (0, _create2.default)(_extends({
    packageName: 'zos-vouching',
    contractAlias: 'ZEPToken',
    initMethod: 'initialize',
    initArgs: [basicJurisdictionAddress, attributeID]
  }, options));

  console.log(_colors2.default.gray(`ZEPToken instance created at: ${proxy.address}`).inverse);

  return proxy;
}

async function createVouchingInstance(minimumStake, zepTokenAddress, options) {
  console.log(_colors2.default.gray(`creating instance for Vouching with minimumStake: ${minimumStake} and zepTokenAddress: ${zepTokenAddress}`).inverse);

  // Run script.
  const proxy = await (0, _create2.default)(_extends({
    packageName: 'zos-vouching',
    contractAlias: 'Vouching',
    initMethod: 'initialize',
    initArgs: [minimumStake, zepTokenAddress]
  }, options));

  console.log(_colors2.default.gray(`Vouching instance created at: ${proxy.address}`).inverse);

  return proxy;
}

async function createZEPValidatorInstance(basicJurisdictionAddress, attributeID, options) {
  console.log(_colors2.default.gray(`creating instance for ZEPValidator with basicJurisdictionAddress: ${basicJurisdictionAddress} and attributeID: ${attributeID}`).inverse);

  // Run script.
  const proxy = await (0, _create2.default)(_extends({
    packageName: 'zos-vouching',
    contractAlias: 'ZEPValidator',
    initMethod: 'initialize',
    initArgs: [basicJurisdictionAddress, attributeID]
  }, options));

  console.log(_colors2.default.gray(`ZEPValidator instance created at: ${proxy.address}`).inverse);

  return proxy;
}