import { shouldTranspileToValidContract } from './LocalContract.behaviour';

describe(`ElementaryTypesWithConstructor contract`, (): void => {
  shouldTranspileToValidContract('ElementaryTypesWithConstructor', {
    ElementaryTypesWithConstructor: {
      path: 'ElementaryTypesWithConstructor',
      fileName: 'ElementaryTypesWithConstructor',
      contracts: ['ElementaryTypesWithConstructor'],
    },
  });
});
