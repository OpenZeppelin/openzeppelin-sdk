'use strict';
require('../setup');

import sinon from 'sinon';
import { expect } from 'chai';

import add from '../../scripts/add';
import addAll from '../../scripts/add-all';
import ProjectFile from '../../models/files/ProjectFile';

describe('add script', function() {
  const contractName = 'ImplV1';
  const contractAlias = 'Impl';
  const contractsData = [{ name: contractName, alias: contractAlias }];

  beforeEach('setup', async function() {
    this.projectFile = new ProjectFile('mocks/packages/package-with-stdlib.zos.json');
    sinon.stub(this.projectFile, 'root').get(() => process.cwd());
  });

  afterEach(function() {
    sinon.restore();
  });

  it('should add a logic contract an alias and a filename', function() {
    add({ contractsData, projectFile: this.projectFile });

    this.projectFile.contract(contractAlias).should.eq(contractName);
  });

  it('should add a logic contract for a lib', function() {
    this.projectFile.lib = true;

    add({ contractsData, projectFile: this.projectFile });

    this.projectFile.contract(contractAlias).should.eq(contractName);
  });

  it('should allow to change an existing logic contract', function() {
    add({ contractsData, projectFile: this.projectFile });

    const customContractName = 'ImplV2';
    const customContractsData = [{ name: customContractName, alias: contractAlias }];
    add({ contractsData: customContractsData, projectFile: this.projectFile });

    this.projectFile.contract(contractAlias).should.eq(customContractName);
  });

  it('should allow contractsData to be an array of contract names instead of an object', function() {
    add({ contractsData: [contractName], projectFile: this.projectFile });

    this.projectFile.contract(contractName).should.not.be.null;
    this.projectFile.contract(contractName).should.eq(contractName);
  });

  it('should handle multiple contracts', function() {
    const customContractAlias = 'Impl';
    const customContractName = 'ImplV1';
    const anotherCustomContractAlias = 'WithLibraryImpl';
    const anotherCustomContractName = 'WithLibraryImplV1';
    const customContractsData = [
      { name: customContractName, alias: customContractAlias },
      { name: anotherCustomContractName, alias: anotherCustomContractAlias },
    ];
    add({ contractsData: customContractsData, projectFile: this.projectFile });

    this.projectFile.contract(customContractAlias).should.eq(customContractName);
    this.projectFile.contract(anotherCustomContractAlias).should.eq(anotherCustomContractName);
  });

  it('should use a default alias if one is not provided', function() {
    const contractsData = [{ name: contractName }];
    add({ contractsData, projectFile: this.projectFile });

    this.projectFile.contract(contractName).should.eq(contractName);
  });

  it('should add all contracts in build contracts dir', function() {
    addAll({ projectFile: this.projectFile });

    this.projectFile.contract('ImplV1').should.eq('ImplV1');
    this.projectFile.contract('ImplV2').should.eq('ImplV2');
  });

  it('should not add solidity libraries or contracts from external packages when adding all', function() {
    addAll({ projectFile: this.projectFile });

    expect(this.projectFile.contract('Initializable')).to.be.undefined;
    expect(this.projectFile.contract('GreeterImpl')).to.be.undefined;
    expect(this.projectFile.contract('GreeterLib')).to.be.undefined;
    expect(this.projectFile.contract('UintLib')).to.be.undefined;
    this.projectFile.contracts.should.have.property('WithExternalContractImplV1');
    this.projectFile.contracts.should.have.property('WithExternalContractImplV2');
  });

  describe('failures', function() {
    it('should fail to add a contract that does not exist', function() {
      const contractsData = [{ name: 'NonExists', alias: contractAlias }];
      expect(() => add({ contractsData, projectFile: this.projectFile })).to.throw(/not found/);
    });

    it('should fail to add an abstract contract', function() {
      const contractsData = [{ name: 'Impl', alias: contractAlias }];
      expect(() => add({ contractsData, projectFile: this.projectFile })).to.throw(/abstract/);
    });

    xit('should fail to add a contract with an invalid alias');
  });
});
