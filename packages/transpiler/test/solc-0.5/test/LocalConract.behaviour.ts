import { transpileContracts } from '../../../src/index';
import { artifacts } from './setup';

export function shouldTranspileToValidContract(contract: string): void {
  describe(`${contract} contract`, (): void => {
    it(`is converted to a valid ${contract}Upgradable contract`, (): void => {
      const [file] = transpileContracts([contract], artifacts);

      expect(file.source).toMatchSnapshot();
      expect(file.fileName).toBe(`${contract}.sol`);
      expect(file.path).toBe(`./contracts/__upgradable__/${contract}Upgradable.sol`);
      expect(file.contracts).toEqual([contract]);
    });
  });
}
