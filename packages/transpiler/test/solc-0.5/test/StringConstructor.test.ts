import { shouldTranspileToValidContract } from './LocalContract.behaviour';

describe(`StringConstructor contract`, (): void => {
  shouldTranspileToValidContract('StringConstructor', {
    StringConstructor: {
      path: 'StringConstructor',
      fileName: 'StringConstructor',
      contracts: ['StringConstructor'],
    },
  });
});
