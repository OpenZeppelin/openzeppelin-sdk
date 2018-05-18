'use strict'
require('../setup')

import { Logger, FileSystem as fs } from 'zos-lib';
import { cleanup, cleanupfn } from "../helpers/cleanup.js";

import init from "../../src/scripts/init.js";
import CaptureLogs from '../helpers/captureLogs';
import addImplementation from "../../src/scripts/add-implementation.js";

contract('add-implementation command', function() {
  const packageFileName = "test/tmp/zos.json";
  const appName = "MyApp";
  const contractName = "ImplV1";
  const contractAlias = "Impl";
  const defaultVersion = "0.1.0";
  const contractsData = [{ name: contractName, alias: contractAlias }]

  beforeEach('setup', async function() {
    cleanup(packageFileName);
    await init({ name: appName, version: defaultVersion, packageFileName });
  });

  after(cleanupfn(packageFileName));

  it('should add an implementation with an alias and a filename', function() {
    addImplementation({ contractsData, packageFileName});
    const data = fs.parseJson(packageFileName);
    data.contracts[contractAlias].should.eq(contractName);
  });

  it('should add an implementation for a lib', function() {
    fs.editJson(packageFileName, p => { p.lib = true; });
    addImplementation({ contractsData, packageFileName});
    const data = fs.parseJson(packageFileName);
    data.contracts[contractAlias].should.eq(contractName);
  });

  it('should allow to change an existing implementation', function() {
    addImplementation({ contractsData, packageFileName });
    const customContractName = "ImplV2";
    const customContractsData = [{ name: customContractName, alias: contractAlias }]
    addImplementation({ contractsData: customContractsData, packageFileName });
    const data = fs.parseJson(packageFileName);
    data.contracts[contractAlias].should.eq(customContractName);
  });

  it('should handle multiple contracts', function() {
    const customContractAlias = "Impl"
    const customContractName = "ImplV1"
    const anotherCustomContractAlias = "AnotherImpl"
    const anotherCustomContractName = "AnotherImplV1"
    const customContractsData = [
      { name: customContractName, alias: customContractAlias },
      { name: anotherCustomContractName, alias: anotherCustomContractAlias },
    ]

    addImplementation({ contractsData: customContractsData, packageFileName });
    const data = fs.parseJson(packageFileName);
    data.contracts[customContractAlias].should.eq(customContractName);
    data.contracts[anotherCustomContractAlias].should.eq(anotherCustomContractName);
  });

  it('should use a default alias if one is not provided', function() {
    const contractsData = [{ name: contractName }]
    addImplementation({ contractsData, packageFileName });
    const data = fs.parseJson(packageFileName);
    data.contracts[contractName].should.eq(contractName);
  });

  describe('failures', function () {
    it('should fail to add a contract that does not exist', function() {
      const contractsData = [{ name: 'NonExists', alias: contractAlias }]
      expect(() => addImplementation({ contractsData, packageFileName })).to.throw(/not found/);
    });

    it('should fail to add an abstract contract', function() {
      const contractsData = [{ name: 'Impl', alias: contractAlias }]
      expect(() => addImplementation({ contractsData, packageFileName })).to.throw(/abstract/);
    });

    xit('should fail to add a contract with an invalid alias');
  });

  describe('warnings', function () {
    beforeEach('capturing log output', function () {
      this.logs = new CaptureLogs();
    });

    afterEach(function () {
      this.logs.restore();
    });

    it('should warn when adding a contract with a constructor', async function() {
      addImplementation({ contractsData: [{ name: "WithConstructor", alias: "WithConstructor" }], packageFileName});
      this.logs.errors.should.have.lengthOf(1);
      this.logs.errors[0].should.match(/constructor/i);
    });

    it('should not warn when adding a contract without a constructor', async function() {
      addImplementation({ contractsData, packageFileName});
      this.logs.errors.should.have.lengthOf(0);
    });
  });
});
