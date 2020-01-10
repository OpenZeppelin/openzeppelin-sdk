import { transpileContracts } from '../../../src/index';
import { artifacts } from './setup';

export function shouldTranspileToValidContract(contract: string, fileName: string, contracts: string[]): void {
  describe(`${contract} contract`, (): void => {
    it(`is converted to a valid ${contract}Upgradable contract`, (): void => {
      const [file] = transpileContracts([contract], artifacts);

      expect(file.source).toMatchSnapshot();
      expect(file.fileName).toBe(`${fileName}.sol`);
      expect(file.path).toBe(`./contracts/__upgradable__/${fileName}Upgradable.sol`);
      expect(file.contracts).toEqual(contracts);
    });
  });
}
