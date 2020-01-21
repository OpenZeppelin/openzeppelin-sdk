import { transpileAndSaveContracts, compileContracts } from './setup';

describe('When all the contracts transpilied and saved to contracts folder', (): void => {
  beforeAll(
    async (): Promise<void> => {
      await transpileAndSaveContracts(
        ['GLDToken', 'ElementaryTypesWithConstructor', 'ElementaryTypes', 'Deep', 'SIC'],
        './build/contracts/',
      );
    },
  );
  it('upgradeable contracts successfully compile', async (): Promise<void> => {
    jest.setTimeout(10000);
    await compileContracts();
  });
});
