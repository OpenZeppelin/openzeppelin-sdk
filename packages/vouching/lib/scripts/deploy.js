'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// zOS commands.


// Enable zOS logging.


var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _push = require('zos/lib/scripts/push');

var _push2 = _interopRequireDefault(_push);

var _zosLib = require('zos-lib');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_zosLib.Logger.silent(false);

exports.default = async function deploy(options) {
  console.log(_colors2.default.cyan(`pushing app with options ${JSON.stringify(options, null, 2)}`).inverse);

  // If network is local, remove existing file.
  const zosLocalPath = './zos.local.json';
  if (options.network === 'local' && _fs2.default.existsSync(zosLocalPath)) {
    console.log(_colors2.default.yellow(`Deleting old zos.local.json (this is only done for the local network).`));
    _fs2.default.unlinkSync(zosLocalPath);
  }

  // Warn about the need for tpl-contracts-zos to already be deployed in the network.
  console.log(_colors2.default.yellow(`Note: this assumes that tpl-contracts-zos is already deployed in ${options.network}.`));

  // Run script.
  await (0, _push2.default)(_extends({}, options));

  console.log(_colors2.default.cyan(`app pushed.`).inverse);
};