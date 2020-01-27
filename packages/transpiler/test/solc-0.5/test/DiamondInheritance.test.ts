import { shouldTranspileToValidContract } from './LocalConract.behaviour';

describe(`Diamond contract`, (): void => {
  shouldTranspileToValidContract('DC', {
    DC: {
      path: 'DiamondInheritance',
      fileName: 'DiamondInheritance',
      contracts: ['DC', 'DB1', 'DB2', 'DA'],
    },
    DB1: {
      path: 'DiamondInheritance',
      fileName: 'DiamondInheritance',
      contracts: ['DC', 'DB1', 'DB2', 'DA'],
    },
    DB2: {
      path: 'DiamondInheritance',
      fileName: 'DiamondInheritance',
      contracts: ['DC', 'DB1', 'DB2', 'DA'],
    },
    DA: {
      path: 'DiamondInheritance',
      fileName: 'DiamondInheritance',
      contracts: ['DC', 'DB1', 'DB2', 'DA'],
    },
  });
});
