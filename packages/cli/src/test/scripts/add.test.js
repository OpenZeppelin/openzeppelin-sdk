'use strict';
require('../setup');

import sinon from 'sinon';
import { expect } from 'chai';

import add from '../../scripts/add';
import addAll from '../../scripts/add-all';
import ProjectFile from '../../models/files/ProjectFile';

describe('add script', function() {
  const contractName = 'ImplV1';
  const contracts = [contractName];

  beforeEach('setup', async function() {
    this.projectFile = new ProjectFile('mocks/packages/package-with-stdlib.zos.json');
    sinon.stub(this.projectFile, 'root').get(() => process.cwd());
  });

  afterEach(function() {
    sinon.restore();
  });

  it('should add a contract name and a filename', function() {
    add({ contracts, projectFile: this.projectFile });

    this.projectFile.contracts.should.include(contractName);
  });

  it('should add a logic contract for a lib', function() {
    this.projectFile.lib = true;

    add({ contracts, projectFile: this.projectFile });

    this.projectFile.contracts.should.include(contractName);
  });

  it('should handle multiple contracts', function() {
    const customContractName = 'ImplV1';
    const anotherCustomContractName = 'WithLibraryImplV1';
    const customContractsData = [customContractName, anotherCustomContractName];
    add({ contracts: customContractsData, projectFile: this.projectFile });

    this.projectFile.contracts.should.include(customContractName);
    this.projectFile.contracts.should.include(anotherCustomContractName);
  });

  it('should add all contracts in build contracts dir', function() {
    addAll({ projectFile: this.projectFile });

    this.projectFile.contracts.should.include('ImplV1');
    this.projectFile.contracts.should.include('ImplV2');
  });

  it('should not add solidity libraries or contracts from external packages when adding all', function() {
    addAll({ projectFile: this.projectFile });

    this.projectFile.contracts.should.not.include('Initializable');
    this.projectFile.contracts.should.not.include('GreeterImpl');
    this.projectFile.contracts.should.not.include('GreeterLib');
    this.projectFile.contracts.should.not.include('UintLib');

    this.projectFile.contracts.should.include('WithExternalContractImplV1');
    this.projectFile.contracts.should.include('WithExternalContractImplV2');
  });

  describe('failures', function() {
    it('should fail to add a contract that does not exist', function() {
      expect(() => add({ contracts: ['NonExists'], projectFile: this.projectFile })).to.throw(/not found/);
    });

    it('should fail to add an abstract contract', function() {
      expect(() => add({ contracts: ['Impl'], projectFile: this.projectFile })).to.throw(/abstract/);
    });
  });
});
