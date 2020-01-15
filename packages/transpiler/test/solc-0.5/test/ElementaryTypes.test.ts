import { shouldTranspileToValidContract } from './LocalConract.behaviour';

describe(`ElementaryTypes contract`, (): void => {
  shouldTranspileToValidContract('ElementaryTypes', {
    ElementaryTypes: {
      path: 'ElementaryTypes',
      fileName: 'ElementaryTypes',
      contracts: ['ElementaryTypes'],
    },
  });
});
