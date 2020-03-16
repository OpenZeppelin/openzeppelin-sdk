import { shouldTranspileToValidContract } from './LocalContract.behaviour';

describe(`GLDToken contract`, (): void => {
  shouldTranspileToValidContract('GLDToken', {
    GLDToken: {
      path: 'GLDToken',
      fileName: 'GLDToken',
      contracts: ['GLDToken'],
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
