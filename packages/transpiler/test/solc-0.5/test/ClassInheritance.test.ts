import { shouldTranspileToValidContract } from './LocalContract.behaviour';

describe(`ClassInheritance contract`, (): void => {
  shouldTranspileToValidContract('CIB', {
    CIB: {
      path: 'ClassInheritance',
      fileName: 'ClassInheritance',
      contracts: ['CIB', 'CIA'],
    },
    CIA: {
      path: 'ClassInheritance',
      fileName: 'ClassInheritance',
      contracts: ['CIA'],
    },
  });
});
