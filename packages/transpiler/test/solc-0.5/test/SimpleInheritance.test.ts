import { shouldTranspileToValidContract } from './LocalConract.behaviour';

describe(`SimpleInheritance contract`, (): void => {
  shouldTranspileToValidContract('SIB', {
    SIB: {
      path: 'SimpleInheritance',
      fileName: 'SimpleInheritance',
      contracts: ['SIB', 'SIA'],
    },
    SIA: {
      path: 'SimpleInheritance',
      fileName: 'SimpleInheritance',
      contracts: ['SIA'],
    },
  });
});
