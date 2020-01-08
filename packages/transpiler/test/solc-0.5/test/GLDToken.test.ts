import { transpileContracts } from '../../../src/';
import fs from 'fs-extra';

const artifacts = fs.readdirSync('./build/contracts/').map(file => {
  return JSON.parse(fs.readFileSync(`./build/contracts/${file}`).toString());
});

describe('GLDToken contract', (): void => {
  it('is converted to a valid GLDTokenUpgradable contract', (): void => {
    const [GLDTokenFile, ERC20DetailedFile, ERC20File, ContextFile] = transpileContracts(['GLDToken'], artifacts);

    expect(GLDTokenFile.source).toMatchSnapshot();
    expect(GLDTokenFile.fileName).toBe('GLDToken.sol');
    expect(GLDTokenFile.path).toBe('./contracts/__upgradable__/GLDTokenUpgradable.sol');
    expect(GLDTokenFile.contracts).toEqual(['GLDToken']);

    expect(ERC20DetailedFile.source).toMatchSnapshot();
    expect(ERC20DetailedFile.fileName).toBe('ERC20Detailed.sol');
    expect(ERC20DetailedFile.path).toBe(
      './contracts/__upgradable__/@openzeppelin/contracts/token/ERC20/ERC20DetailedUpgradable.sol',
    );
    expect(ERC20DetailedFile.contracts).toEqual(['ERC20Detailed']);

    expect(ERC20File.source).toMatchSnapshot();
    expect(ERC20File.fileName).toBe('ERC20.sol');
    expect(ERC20File.path).toBe('./contracts/__upgradable__/@openzeppelin/contracts/token/ERC20/ERC20Upgradable.sol');
    expect(ERC20File.contracts).toEqual(['ERC20']);

    expect(ContextFile.source).toMatchSnapshot();
    expect(ContextFile.fileName).toBe('Context.sol');
    expect(ContextFile.path).toBe('./contracts/__upgradable__/@openzeppelin/contracts/GSN/ContextUpgradable.sol');
    expect(ContextFile.contracts).toEqual(['Context']);
  });
});
