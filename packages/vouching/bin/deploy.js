#! /usr/bin/env node

import truffleConfig from '../truffle-config.js';
import deploy from '../scripts/deploy';
import runWithTruffle from 'zos/lib/utils/runWithTruffle';

// TODO turn into args
const network = 'local';
const from = truffleConfig.networks[network].from;

runWithTruffle(options => deploy(options), { network, from })
  .then(console.log)
  .catch(console.error);
