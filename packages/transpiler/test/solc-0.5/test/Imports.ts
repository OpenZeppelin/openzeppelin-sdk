import { shouldTranspileToValidContract } from './LocalContract.behaviour';

// todo: once all imports are supported enable this test
describe(`Import contract`, (): void => {
  shouldTranspileToValidContract('Imports', {
    Imports: {
      path: 'Imports',
      fileName: 'Imports',
      contracts: ['Imports'],
    },
    DC: {
      path: 'DiamondInheritance',
      fileName: 'DiamondInheritance',
      contracts: ['DC', 'DB1', 'DB2', 'DA'],
    },
    ERC20Detailed: {
      path: '@openzeppelin/contracts/token/ERC20/ERC20Detailed',
      fileName: 'ERC20Detailed',
      contracts: ['ERC20Detailed'],
    },
    ERC20: {
      path: '@openzeppelin/contracts/token/ERC20/ERC20',
      fileName: 'ERC20',
      contracts: ['ERC20'],
    },
    Context: {
      path: '@openzeppelin/contracts/GSN/Context',
      fileName: 'Context',
      contracts: ['Context'],
    },
  });
});
