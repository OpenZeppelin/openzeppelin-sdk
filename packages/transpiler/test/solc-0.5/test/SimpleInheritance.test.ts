import { shouldTranspileToValidContract } from './LocalConract.behaviour';

describe(`SimpleInheritance contract`, (): void => {
  shouldTranspileToValidContract('SIC', {
    SIC: {
      path: 'SimpleInheritance',
      fileName: 'SimpleInheritance',
      contracts: ['SIC', 'SIB', 'SIA'],
    },
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
