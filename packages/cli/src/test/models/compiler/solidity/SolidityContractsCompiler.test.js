/* eslint-disable @typescript-eslint/camelcase */
require('../../../setup');

import CaptureLogs from '../../../helpers/captureLogs';
import { compile } from '../../../../models/compiler/solidity/SolidityContractsCompiler';
import { setSolcCachePath, setSolcBinEnv } from '../../../../models/compiler/solidity/CompilerProvider';
import sinon from 'sinon';
import axios from 'axios';
import path from 'path';
import fs from 'fs-extra';

describe('SolidityContractsCompiler', function() {
  const contract_Solc04 = {
    fileName: 'Example04.sol',
    filePath: '/test/Example04.sol',
    source:
      'pragma solidity ^0.4.24; contract Example04 { function f() public pure returns (string memory) { return "bla"; } }',
  };

  const anotherContract_Solc04 = {
    fileName: 'AnotherExample04.sol',
    filePath: '/test/AnotherExample04.sol',
    source:
      'pragma solidity 0.4.24; contract AnotherExample04 { function f() public pure returns (uint) { return 2; } }',
  };

  const contractWithWarnings_Solc04 = {
    fileName: 'ExampleWithWarnings04.sol',
    filePath: '/test/ExampleWithWarnings04.sol',
    source:
      'pragma solidity ^0.4.24; contract ExampleWithWarnings04 { function f() public returns (uint) { return 2; } }',
  };

  const contractWithErrors_Solc04 = {
    fileName: 'ExampleWithErrors04.sol',
    filePath: '/test/ExampleWithErrors04.sol',
    source: 'pragma solidity ^0.4.24; contract ExampleWithErrors04 { function f() public { return 2; } }',
  };

  const contract_Solc05 = {
    fileName: 'Example05.sol',
    filePath: '/test/Example05.sol',
    source:
      'pragma solidity ^0.5.0; contract Example05 { function f() public pure returns (string memory) { return "bla"; } }',
  };

  const anotherContract_Solc05 = {
    fileName: 'AnotherExample05.sol',
    filePath: '/test/AnotherExample05.sol',
    source:
      'pragma solidity ^0.5.0; contract AnotherExample05 { function f() public pure returns (uint) { return 2; } }',
  };

  const contractWithWarnings_Solc05 = {
    fileName: 'ExampleWithWarnings05.sol',
    filePath: '/test/ExampleWithWarnings05.sol',
    source: 'pragma solidity ^0.5.0; contract ExampleWithWarnings05 { function f() public { } }',
  };

  const contractWithErrors_Solc05 = {
    fileName: 'ExampleWithErrors05.sol',
    filePath: '/test/ExampleWithErrors.sol',
    source: 'pragma solidity ^0.5.0; contract ExampleWithErrors05 { function f() public { return 2; } }',
  };

  const contractNoPragma_Solc05 = {
    fileName: 'ExampleNoPragma05.sol',
    filePath: '/test/ExampleNoPragma05.sol',
    source: 'contract ExampleNoPragma05 { function f() public pure returns (string memory) { return "bla"; } }',
  };

  before('stub solc list', function() {
    setSolcCachePath(path.resolve(__dirname, '../../../../../solc/'));
    sinon
      .stub(axios, 'get')
      .withArgs('https://solc-bin.ethereum.org/bin/list.json')
      .resolves({ data: fs.readJsonSync(require.resolve('../../../../../solc/list.json')) });
  });

  after('clear stubs', function() {
    sinon.restore();
  });

  beforeEach('capturing logging', function() {
    this.logs = new CaptureLogs();
  });

  afterEach('restore logging', function() {
    this.logs.restore();
  });

  beforeEach('disable local solc lookup', function() {
    setSolcBinEnv({ PATH: '' });
  });

  afterEach('reenable solc lookup', function() {
    setSolcBinEnv(null);
  });

  describe('version 0.5.x binary', function() {
    beforeEach(function() {
      setSolcBinEnv({
        PATH: `${process.env.PATH}${path.delimiter}${path.resolve(__dirname, '../../../../../solc/')}`,
      });
    });

    afterEach(function() {
      setSolcBinEnv(null);
    });

    it('compiles using local binary if available', async function() {
      const contracts = [contract_Solc05];
      const output = await compile(contracts, { version: '0.5.9' });
      assertOutput(contracts, output, {
        version: '0.5.9+commit.c68bc34e.Linux.g++',
        evmVersion: 'petersburg',
      });
      this.logs.errors.should.be.empty;
      this.logs.warns.should.be.empty;
    }).timeout(180000);

    it('fails when a contract has errors', async function() {
      const options = { version: '0.5.0' };
      const contracts = [contract_Solc05, contractWithErrors_Solc05];
      await compile(contracts, options).should.be.rejectedWith(
        /Different number of arguments in return statement than in returns declaration/,
      );
    }).timeout(180000);

    it('compiles using solcjs if binary version does not match', async function() {
      const contracts = [contract_Solc05];
      const output = await compile(contracts, { version: '0.5.0' });
      assertOutput(contracts, output, {
        version: '0.5.0+commit.1d4f565a.Emscripten.clang',
        evmVersion: 'byzantium',
      });
      this.logs.errors.should.be.empty;
      this.logs.warns.should.be.empty;
    }).timeout(180000);
  });

  describe('version 0.5.x solcjs', function() {
    it('compiles using solc nigthly if specified exactly', async function() {
      const contracts = [contract_Solc05];
      const output = await compile(contracts, {
        version: '0.5.10-nightly.2019.5.28',
      });
      assertOutput(contracts, output, {
        version: '0.5.10-nightly.2019.5.28+commit.ff8898b8.Emscripten.clang',
        evmVersion: 'petersburg',
      });
      this.logs.errors.should.be.empty;
      this.logs.warns[0].should.match(/This is a pre-release compiler version/);
    }).timeout(180000);

    it('compiles using latest release if no pragma or options are set', async function() {
      const contracts = [contractNoPragma_Solc05];
      const output = await compile(contracts, {});
      assertOutput(contracts, output, {
        version: '0.5.9+commit.e560f70d.Emscripten.clang',
        evmVersion: 'petersburg',
      });
      this.logs.errors.should.be.empty;
      this.logs.warns[0].should.match(/Source file does not specify required compiler version/);
    }).timeout(180000);

    it('compiles using solc 0.5.9 based on pragma', async function() {
      const contracts = [contract_Solc05, anotherContract_Solc05];
      const output = await compile(contracts, {});
      assertOutput(contracts, output, {
        version: '0.5.9+commit.e560f70d.Emscripten.clang',
        evmVersion: 'petersburg',
      });
      this.logs.errors.should.be.empty;
      this.logs.warns.should.be.empty;
    }).timeout(180000);

    it('compiles using solc 0.5.0 and optimizer based on options', async function() {
      const contracts = [contract_Solc05, anotherContract_Solc05];
      const options = {
        version: '0.5.0',
        optimizer: { enabled: true, runs: 200 },
      };
      const output = await compile(contracts, options);
      assertOutput(contracts, output, {
        version: '0.5.0+commit.1d4f565a.Emscripten.clang',
        optimizer: options.optimizer,
        evmVersion: 'byzantium',
      });
      this.logs.errors.should.be.empty;
      this.logs.warns.should.be.empty;
    }).timeout(180000);

    it('compiles with warnings', async function() {
      const options = { version: '0.5.0' };
      const contracts = [contract_Solc05, anotherContract_Solc05, contractWithWarnings_Solc05];
      const output = await compile(contracts, options);
      assertOutput(contracts, output, {
        version: '0.5.0+commit.1d4f565a.Emscripten.clang',
        evmVersion: 'byzantium',
      });
      this.logs.errors.should.be.empty;
      this.logs.warns.should.have.lengthOf(1);
      this.logs.warns[0].should.match(/Function state mutability can be restricted to pure/);
    }).timeout(180000);

    it('fails when a contract has errors', async function() {
      const options = { version: '0.5.0' };
      const contracts = [contract_Solc05, anotherContract_Solc05, contractWithErrors_Solc05];
      await compile(contracts, options).should.be.rejectedWith(
        /Different number of arguments in return statement than in returns declaration/,
      );
    }).timeout(180000);

    it('fails when source requires different compiler version', async function() {
      const options = { version: '0.5.0' };
      const contracts = [contract_Solc05, contract_Solc04];
      await compile(contracts, options).should.be.rejectedWith(/Source file requires different compiler version/);
    }).timeout(180000);

    it('fails when source require incompatible compiler versions', async function() {
      const contracts = [contract_Solc05, contract_Solc04];
      await compile(contracts, {}).should.be.rejectedWith(/Could not find a compiler that matches required versions/);
    }).timeout(180000);
  });

  describe('version 0.4.x', function() {
    const version = '0.4.24+commit.e67f0147.Emscripten.clang';
    const evmVersion = 'byzantium';
    const contracts = [contract_Solc04, anotherContract_Solc04];
    const options = { version: '0.4.24' };

    it('compiles using solc 0.4.24 based on pragma', async function() {
      const output = await compile(contracts, {});
      assertOutput(contracts, output, { version, evmVersion });
      this.logs.errors.should.be.empty;
      this.logs.warns.should.be.empty;
    }).timeout(180000);

    it('compiles using solc 0.4.24 based on options', async function() {
      const output = await compile(contracts, options);
      assertOutput(contracts, output, { version, evmVersion });
      this.logs.errors.should.be.empty;
      this.logs.warns.should.be.empty;
    }).timeout(180000);

    it('compiles using solc 0.4.24 with optimizer based on options', async function() {
      const options = {
        version: '0.4.24',
        optimizer: { enabled: true, runs: 200 },
      };
      const output = await compile(contracts, options);
      assertOutput(contracts, output, { ...options, version, evmVersion });
      this.logs.errors.should.be.empty;
      this.logs.warns.should.be.empty;
    }).timeout(180000);

    it('compiles and logs warnings', async function() {
      const contracts = [contract_Solc04, anotherContract_Solc04, contractWithWarnings_Solc04];
      const output = await compile(contracts, options);
      assertOutput(contracts, output, { version, evmVersion });
      this.logs.errors.should.be.empty;
      this.logs.warns.should.have.lengthOf(1);
      this.logs.warns[0].should.match(/Function state mutability can be restricted to pure/);
    }).timeout(180000);

    it('fails to compile contract with errors', async function() {
      const contracts = [contract_Solc04, anotherContract_Solc04, contractWithErrors_Solc04];
      await compile(contracts, options).should.be.rejectedWith(
        /Different number of arguments in return statement than in returns declaration/,
      );
    }).timeout(180000);

    it('fails when source requires different compiler version', async function() {
      const contracts = [contract_Solc05, contract_Solc04];
      await compile(contracts, options).should.be.rejectedWith(/Source file requires different compiler version/);
    }).timeout(180000);
  });
});

function assertOutput(contracts, output, { version, optimizer, evmVersion }) {
  output.should.have.lengthOf(contracts.length);
  output.forEach(data => {
    const contract = contracts.find(contract => contract.fileName === data.fileName);
    const { source, fileName, filePath } = contract;
    const contractName = fileName.substring(0, fileName.lastIndexOf('.'));

    data.contractName.should.be.eq(contractName);
    data.source.should.be.eq(source);
    data.sourcePath.should.be.eq(filePath);
    data.sourceMap.should.not.be.null;
    data.deployedSourceMap.should.not.be.null;
    data.abi.should.not.be.null;
    data.ast.should.not.be.null;
    data.bytecode.should.not.be.null;
    data.deployedBytecode.should.not.be.null;
    data.compiler.name.should.be.eq('solc');
    [version, '0.5.9+commit.e560f70d.Emscripten.clang'].should.include(data.compiler.version);
    data.compiler.optimizer.should.be.deep.equal(optimizer || { enabled: false });
    data.compiler.evmVersion.should.be.eq(evmVersion || 'constantinople');
  });
}
