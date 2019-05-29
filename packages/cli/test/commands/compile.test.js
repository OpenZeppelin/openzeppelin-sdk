'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share';

describe('compile command', function() {
  stubCommands()

  itShouldParse('should call compile', 'compiler', 'zos compile', function(compiler) {
    compiler.should.have.been.calledOnce;
  })

  itShouldParse('should call truffle compile', 'truffleCompiler', 'zos compile --using truffle', function(compiler) {
    compiler.should.have.been.calledOnce;
  })

  itShouldParse('should call zos compile with options', 'solcCompiler', 'zos compile --using zos --solc-version 0.5.0 --optimizer --optimizer-runs 300 --evm-version petersburg', function(compiler) {
    compiler.should.have.been.calledWithExactly({ version: '0.5.0', optimizer: { enabled: true, runs: "300" }, evmVersion: 'petersburg' });
  })  
})
