#! /usr/bin/env node
'use strict';

var _truffleConfig = require('../../truffle-config.js');

var _truffleConfig2 = _interopRequireDefault(_truffleConfig);

var _deploy = require('../scripts/deploy');

var _deploy2 = _interopRequireDefault(_deploy);

var _runWithTruffle = require('zos/lib/utils/runWithTruffle');

var _runWithTruffle2 = _interopRequireDefault(_runWithTruffle);

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const params = (0, _minimist2.default)(process.argv.slice(2), {
  string: 'from'
});
const network = params.network;
const from = params.from;
if (!network) throw new Error('Please specify a network using -network=<network>.');
if (!from) throw new Error('Please specify a sender address using -from=<addr>.');

(0, _runWithTruffle2.default)(options => (0, _deploy2.default)(options), { network, from }).then(console.log).catch(console.error);