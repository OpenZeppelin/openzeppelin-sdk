#!/usr/bin/env node

const fs = require('fs');
const proc = require('child_process');
const assert = require('assert');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const exec = promisify(proc.exec);

async function main() {
  const net = await network();
  await testSimple(net, 'regular');
  await testSimple(net, 'upgradeable');
  await testSimple(net, 'minimal');

  await testArguments(net, 'regular', 'ValueWithConstructor');
  await testArguments(net, 'upgradeable', 'ValueWithInitializer');

  await assert.rejects(testArguments(net, 'upgradeable', 'ValueWithConstructor'));
}

// Tests a simple contract with no constructor or initializer.
async function testSimple(net, kind) {
  const deploy = await exec(`oz deploy -n "${net}" -k "${kind}" Answer`);
  const instance = deploy.stdout.trim();
  const call = await exec(`oz call -n "${net}" --to "${instance}" --method answer`)
  assert.strictEqual(call.stdout, '42\n');
}

// Tests a contract with constructor/initializer arguments.
async function testArguments(net, kind, contract) {
  const deploy = await exec(`oz deploy -n "${net}" -k "${kind}" "${contract}" 5 10`);
  const instance = deploy.stdout.trim();
  const call = await exec(`oz call -n "${net}" --to "${instance}" --method value`)
  assert.strictEqual(call.stdout, '50\n');
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
