'use strict';

require('../../setup');

import { tryRemoveMetadata } from '../../../src/utils/Bytecode';

describe('contracts util functions', function() {
  describe('tryRemoveMetadata', function() {
    const contractBytecode = '01234567890abcdef';

    it('removes metadata from solidity 0.4 bytecode', function() {
      const swarmHash =
        '69b1869ae52f674ffccdd8f6d35de04d578a778e919a1b41b7a2177668e08e1a';
      const swarmHashWrapper = `65627a7a72305820${swarmHash}`;
      const metadata = `a1${swarmHashWrapper}0029`;
      const bytecode = `0x${contractBytecode}${metadata}`;

      tryRemoveMetadata(bytecode).should.eq(`0x${contractBytecode}`);
    });

    it('removes metadata from solidity 0.5 bytecode', function() {
      const swarmHash =
        '69b1869ae52f674ffccdd8f6d35de04d578a778e919a1b41b7a2177668e08e1a';
      const swarmHashWrapper = `65627a7a72305820${swarmHash}`;
      const solcVersionWrapper = '64736f6c6343000509';
      const metadata = `a2${swarmHashWrapper}${solcVersionWrapper}0032`;
      const bytecode = `0x${contractBytecode}${metadata}`;

      tryRemoveMetadata(bytecode).should.eq(`0x${contractBytecode}`);
    });

    it('does not change the bytecode if metadata encoding is invalid', function() {
      const swarmHash =
        '69b1869ae52f674ffccdd8f6d35de04d578a778e919a1b41b7a2177668e08e1a';
      const invalidSwarmHashWrapper = `a165627a7a72305821${swarmHash}0029`;
      const bytecode = `0x${contractBytecode}${invalidSwarmHashWrapper}`;

      tryRemoveMetadata(bytecode).should.eq(bytecode);
    });

    it('does not change the bytecode if metadata length is not reliable', function() {
      const swarmHash =
        '69b1869ae52f674ffccdd8f6d35de04d578a778e919a1b41b7a2177668e08e1a';
      const invalidSwarmHashWrapper = `a165627a7a72305821${swarmHash}9929`;
      const bytecode = `0x${contractBytecode}${invalidSwarmHashWrapper}`;

      tryRemoveMetadata(bytecode).should.eq(bytecode);
    });
  });
});
