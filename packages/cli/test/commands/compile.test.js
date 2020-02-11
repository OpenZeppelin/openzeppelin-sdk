'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';
import sinon from 'sinon';

describe('compile command', function() {
  stubCommands();

  itShouldParse('should call compile', 'compiler', 'zos compile --no-interactive', function(compiler) {
    compiler.should.have.been.calledOnce;
  });

  itShouldParse(
    'should call compile with options',
    'compiler',
    'zos compile --solc-version 0.5.0 --optimizer --optimizer-runs 300 --evm-version petersburg --no-interactive',
    function(compiler) {
      compiler.should.have.been.calledWithMatch({
        manager: 'openzeppelin',
        version: '0.5.0',
        optimizer: { enabled: true, runs: 300 },
        evmVersion: 'petersburg',
      });
    },
  );

  itShouldParse(
    'should call compile with optimizer disabled',
    'compiler',
    'zos compile --solc-version 0.5.0 --optimizer=off --no-interactive',
    function(compiler) {
      compiler.should.have.been.calledWithMatch({
        manager: 'openzeppelin',
        version: '0.5.0',
        optimizer: { enabled: false },
      });
    },
  );

  itShouldParse(
    'should call compile with typechain',
    'compiler',
    'oz compile --typechain=web3-v1 --typechain-outdir=foo --no-interactive',
    function(compiler) {
      compiler.should.have.been.calledWith(
        sinon.match({
          manager: 'openzeppelin',
          typechain: {
            enabled: true,
            outDir: 'foo',
            target: 'web3-v1',
          },
        }),
      );
    },
  );
});
