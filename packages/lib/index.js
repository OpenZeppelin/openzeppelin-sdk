'use strict';

var zos = module.exports;

// module information
zos.version = 'v' + require('./package.json').version;

// helpers
zos.assertRevert = require('./lib/assertRevert');
zos.decodeLogs = require('./lib/decodeLogs');
zos.encodeCall = require('./lib/encodeCall');
