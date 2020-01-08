import fs from 'fs-extra';
import path from 'path';

import { transpileContracts } from '../../../src/';

async function main(): Promise<void> {
  const artifacts = fs.readdirSync('./build/contracts/').map(file => {
    return JSON.parse(fs.readFileSync(`./build/contracts/${file}`).toString());
  });

  const output = transpileContracts(['GLDToken'], artifacts);

  for (const file of output) {
    await fs.ensureDir(path.dirname(file.path));
    fs.writeFileSync(file.path, file.source);
  }
}

main().then(() => {
  // waiting for the fix of an issue
  // https://github.com/prettier-solidity/prettier-plugin-solidity/issues/211
  // require("child_process").execSync("npx prettier --write **/*.sol");
});
