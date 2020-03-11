import { shouldTranspileToValidContract } from './LocalConract.behaviour';

describe(`StringConstructor contract`, (): void => {
  shouldTranspileToValidContract('StringConstructor', {
    StringConstructor: {
      path: 'StringConstructor',
      fileName: 'StringConstructor',
      contracts: ['StringConstructor'],
    },
  });
});
