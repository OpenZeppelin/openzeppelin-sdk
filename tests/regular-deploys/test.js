#!/usr/bin/env node

const fs = require('fs');
const proc = require('child_process');
const assert = require('assert');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const exec = promisify(proc.exec);

const { provider } = require('@openzeppelin/test-environment');

async function main() {
  await provider.queue.onIdle();

  const url = provider.wrappedProvider.host;
  const config = { networks: { dev: { url } } };

  await writeFile('networks.js', `module.exports = ${JSON.stringify(config)};\n`);

  const deploy = await exec('oz deploy -n dev -k regular Demo');
  const address = deploy.stdout.trim();

  const call = await exec(`oz call -n dev --to "${address}" --method answer`)
  assert.strictEqual(call.stdout, '42\n');
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
