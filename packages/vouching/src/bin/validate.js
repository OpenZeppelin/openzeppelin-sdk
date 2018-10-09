#! /usr/bin/env node

import validate from '../scripts/validate';
import runWithTruffle from 'zos/lib/utils/runWithTruffle';
import parseArgs from 'minimist';

const params = parseArgs(process.argv.slice(2), {
  string: 'from'
});
const network = params.network;
const from = params.from;
if(!network) throw new Error('Please specify a network using -network=<network>.');
if(!from) throw new Error('Please specify a sender address using -from=<addr>.');

runWithTruffle(options => validate(options), { network, from })
  .then(console.log)
  .catch(console.error);
