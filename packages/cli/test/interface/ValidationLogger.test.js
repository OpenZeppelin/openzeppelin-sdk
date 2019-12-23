'use strict';
require('../setup');

import CaptureLogs from '../helpers/captureLogs';
import { Contracts, getStorageLayout, compareStorageLayouts, getBuildArtifacts } from '@openzeppelin/upgrades';
import ValidationLogger from '../../src/interface/ValidationLogger';

describe('ValidationLogger', function() {
  beforeEach('capturing log output', function() {
    this.logs = new CaptureLogs();
  });

  afterEach(function() {
    this.logs.restore();
  });

  describe('errors', function() {
    it('logs constructor', async function() {
      validationLogger().log({ hasConstructor: true });
      this.logs.errors[0].should.match(/has an explicit constructor/);
    });
  });

  describe('warnings', function() {
    it('logs delegate call', async function() {
      validationLogger().log({ hasDelegateCall: true });
      this.logs.warns[0].should.match(/delegatecall/);
    });

    it('logs selfdestruct', async function() {
      validationLogger().log({ hasSelfDestruct: true });
      this.logs.warns[0].should.match(/selfdestruct/);
    });

    it('logs uninitialized contracts', async function() {
      validationLogger().log({
        uninitializedBaseContracts: ['ContractA', 'ContractB', 'ContractC'],
      });
      this.logs.warns[0].should.match(/has base contracts ContractA, ContractB, ContractC which are initializable/);
    });

    it('logs vars unchecked for storage layout', async function() {
      validationLogger().log({
        storageUncheckedVars: [{ label: 'foo', contract: 'MyContract' }],
      });
      this.logs.warns[0].should.match(/foo \(MyContract\) contains a struct or enum/);
    });

    it('logs when detecting initial values in fields declarations', async function() {
      validationLogger().log({ hasInitialValuesInDeclarations: true });
      this.logs.warns[0].should.match(/sets an initial value/);
    });

    it('logs when importing openzeppelin-contracts', async function() {
      validationLogger().log({ importsVanillaContracts: ['Foo.sol', 'Bar.sol'] });
      this.logs.warns[0].should.match(/@openzeppelin\/contracts/);
    });

    it('does not log with no imports', async function() {
      validationLogger().log({ importsVanillaContracts: [] });
      this.logs.warns.length.should.equal(0);
    });
  });

  describe('storage', function() {
    it('reports no changes', function() {
      compare('StorageMockSimpleOriginal', 'StorageMockSimpleUnchanged');
      this.logs.toString().should.be.empty;
    });

    it('reports inserted var', function() {
      compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithInsertedVar');
      this.logs.errors[0].should.match(
        /New variable 'uint256 c' was inserted in contract StorageMockSimpleWithInsertedVar/,
      );
    });

    it('reports unshifted var', function() {
      compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithUnshiftedVar');
      this.logs.errors[0].should.match(
        /New variable 'uint256 c' was inserted in contract StorageMockSimpleWithUnshiftedVar/,
      );
    });

    it('reports appended var', function() {
      compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithAddedVar');
      this.logs.infos[0].should.match(/New variable 'uint256 c' was added in contract StorageMockSimpleWithAddedVar/);
    });

    it('reports renamed var', function() {
      compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithRenamedVar');
      this.logs.warns[0].should.match(/Variable 'uint256 b' in contract StorageMockSimpleOriginal was renamed to c/);
    });

    it('reports type changed', function() {
      compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithTypeChanged');
      this.logs.warns[0].should.match(
        /Variable 'b' in contract StorageMockSimpleOriginal was changed from uint256 to string/,
      );
    });

    it('reports deleted var', function() {
      compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithDeletedVar');
      this.logs.errors[0].should.match(/Variable 'uint256 a' was removed from contract StorageMockSimpleOriginal/);
    });

    it('reports popped var', function() {
      compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithPoppedVar');
      this.logs.warns[0].should.match(
        /Variable 'uint256 b' was removed from the end of contract StorageMockSimpleOriginal/,
      );
    });

    it('reports replaced var', function() {
      compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithReplacedVar');
      this.logs.warns[0].should.match(
        /Variable 'uint256 b' in contract StorageMockSimpleOriginal was replaced with 'string c'/,
      );
    });
  });
});

function compare(originalContractName, updatedContractName) {
  const buildArtifacts = getBuildArtifacts();
  const originalContract = Contracts.getFromLocal(originalContractName);
  const updatedContract = Contracts.getFromLocal(updatedContractName);
  const comparison = compareStorageLayouts(
    getStorageLayout(originalContract, buildArtifacts),
    getStorageLayout(updatedContract, buildArtifacts),
  );
  new ValidationLogger(updatedContract, getStorageLayout(originalContract)).log({ storageDiff: comparison });
}

function validationLogger(contractName = 'Impl') {
  return new ValidationLogger(Contracts.getFromLocal(contractName));
}
