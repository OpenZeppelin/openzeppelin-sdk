import fs from 'fs-extra';
import path from 'path';
import util from 'util';
import child from 'child_process';

const exec = util.promisify(child.exec);

import { transpileContracts } from '../../../src/';

export async function transpileAndSaveContracts(contracts: string[], dir: string): Promise<void> {
  const artifacts = fs.readdirSync(dir).map(file => {
    return JSON.parse(fs.readFileSync(`${dir}${file}`).toString());
  });

  const output = transpileContracts(contracts, artifacts);

  for (const file of output) {
    await fs.ensureDir(path.dirname(file.path));
    fs.writeFileSync(file.path, file.source);
  }
}

export async function compileContracts(): Promise<void> {
  await exec('npm run compile-contracts');
}

transpileAndSaveContracts(['GLDToken'], './build/contracts/').then(() => {
  // waiting for the fix of an issue
  // https://github.com/prettier-solidity/prettier-plugin-solidity/issues/211
  // require("child_process").execSync("npx prettier --write **/*.sol");
});
