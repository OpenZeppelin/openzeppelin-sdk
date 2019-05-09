'use strict'
require('../setup')

import { Logger } from 'zos-lib';
import CaptureLogs from '../helpers/captureLogs';

import add from '../../src/scripts/add';
import addAll from '../../src/scripts/add-all';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";

contract('add script', function() {
  const contractName = 'ImplV1';
  const contractAlias = 'Impl';
  const contractsData = [{ name: contractName, alias: contractAlias }]

  beforeEach('setup', async function() {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-stdlib.zos.json')
  });

  it('should add a logic contract an alias and a filename', function() {
    add({ contractsData, packageFile: this.packageFile })

    this.packageFile.contract(contractAlias).should.eq(contractName)
  });

  it('should add a logic contract for a lib', function() {
    this.packageFile.lib = true

    add({ contractsData, packageFile: this.packageFile })

    this.packageFile.contract(contractAlias).should.eq(contractName)
  });

  it('should allow to change an existing logic contract', function() {
    add({ contractsData, packageFile: this.packageFile });

    const customContractName = 'ImplV2';
    const customContractsData = [{ name: customContractName, alias: contractAlias }]
    add({ contractsData: customContractsData, packageFile: this.packageFile })

    this.packageFile.contract(contractAlias).should.eq(customContractName)
  });

  it('should allow contractsData to be an array of contract names instead of an object', function() {
    add({ contractsData: [contractName], packageFile: this.packageFile });

    this.packageFile.contract(contractName).should.not.be.null
    this.packageFile.contract(contractName).should.eq(contractName)
  });

  it('should handle multiple contracts', function() {
    const customContractAlias = 'Impl'
    const customContractName = 'ImplV1'
    const anotherCustomContractAlias = 'WithLibraryImpl'
    const anotherCustomContractName = 'WithLibraryImplV1'
    const customContractsData = [
      { name: customContractName, alias: customContractAlias },
      { name: anotherCustomContractName, alias: anotherCustomContractAlias },
    ]
    add({ contractsData: customContractsData, packageFile: this.packageFile });

    this.packageFile.contract(customContractAlias).should.eq(customContractName);
    this.packageFile.contract(anotherCustomContractAlias).should.eq(anotherCustomContractName);
  });

  it('should use a default alias if one is not provided', function() {
    const contractsData = [{ name: contractName }]
    add({ contractsData, packageFile: this.packageFile })

    this.packageFile.contract(contractName).should.eq(contractName)
  });

  it('should add all contracts in build contracts dir', function() {
    addAll({ packageFile: this.packageFile })

    this.packageFile.contract('ImplV1').should.eq('ImplV1')
    this.packageFile.contract('ImplV2').should.eq('ImplV2')
  })

  it('should not add solidity libraries or contracts from external packages when adding all', function() {
    addAll({ packageFile: this.packageFile })

    expect(this.packageFile.contract('Initializable')).to.be.undefined
    expect(this.packageFile.contract('GreeterImpl')).to.be.undefined
    expect(this.packageFile.contract('GreeterLib')).to.be.undefined
    expect(this.packageFile.contract('UintLib')).to.be.undefined
    this.packageFile.contracts.should.have.property('WithExternalContractImplV1');
    this.packageFile.contracts.should.have.property('WithExternalContractImplV2');
  });

  describe('failures', function () {
    it('should fail to add a contract that does not exist', function() {
      const contractsData = [{ name: 'NonExists', alias: contractAlias }]
      expect(() => add({ contractsData, packageFile: this.packageFile })).to.throw(/not found/);
    });

    it('should fail to add an abstract contract', function() {
      const contractsData = [{ name: 'Impl', alias: contractAlias }]
      expect(() => add({ contractsData, packageFile: this.packageFile })).to.throw(/abstract/);
    });

    xit('should fail to add a contract with an invalid alias');
  });
});
