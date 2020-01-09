import { transpileAndSaveContracts, compileContracts } from '../src/index';

describe('When all the contracts transpilied and saved to contracts folder', (): void => {
  beforeAll(
    async (): Promise<void> => {
      await transpileAndSaveContracts(['GLDToken'], './build/contracts/');
    },
  );
  it('upgradeable contracts successfully compile', async (): Promise<void> => {
    jest.setTimeout(10000);
    await compileContracts();
  });
});
