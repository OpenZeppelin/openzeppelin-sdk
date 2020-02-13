#!/usr/bin/env node

const fs = require('fs');
const proc = require('child_process');
const assert = require('assert');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const exec = promisify(proc.exec);

async function main() {
  const net = await network();

  const deploy = await exec(`oz deploy -n "${net}" -k regular Demo`);
  const instance = deploy.stdout.trim();

  const call = await exec(`oz call -n "${net}" --to "${instance}" --method answer`)
  assert.strictEqual(call.stdout, '42\n');
}

async function network() {
  if (process.env.NETWORK) {
    return process.env.NETWORK;
  } else {
    const { provider } = require('@openzeppelin/test-environment');
    await provider.queue.onIdle();

    const url = provider.wrappedProvider.host;
    const config = { 'test-env': { url } };
    await writeFile('extra-networks.json', JSON.stringify(config));

    return 'test-env';
  }
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
