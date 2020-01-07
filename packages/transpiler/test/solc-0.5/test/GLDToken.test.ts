import { transpileContracts } from '../../../src/';
import fs from 'fs-extra';

const artifacts = fs.readdirSync('./build/contracts/').map(file => {
  return JSON.parse(fs.readFileSync(`./build/contracts/${file}`).toString());
});

describe('GLDToken contract', (): void => {
  it('is converted to a valid GLDTokenUpgradable contract', (): void => {
    const files = transpileContracts(['GLDToken'], artifacts);
    expect(files.length).toBe(4);
  });
});
