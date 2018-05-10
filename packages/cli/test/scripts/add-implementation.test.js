import init from "../../src/scripts/init.js";
import addImplementation from "../../src/scripts/add-implementation.js";
import { cleanup, cleanupfn } from "../helpers/cleanup.js";
import { FileSystem as fs } from 'zos-lib';

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('add-implementation command', function() {
  const packageFileName = "test/tmp/package.zos.json";
  const appName = "MyApp";
  const contractName = "ImplV1";
  const contractAlias = "Impl";
  const defaultVersion = "0.1.0";
  
  beforeEach('setup', async function() {
    cleanup(packageFileName);
    await init({ name: appName, version: defaultVersion, packageFileName });
  });

  after(cleanupfn(packageFileName));

  it('should add an implementation with an alias and a filename', function() {
    addImplementation({ contractName, contractAlias, packageFileName});
    const data = fs.parseJson(packageFileName);
    data.contracts[contractAlias].should.eq(contractName);
  });

  it('should allow to change an existing implementation', function() {
    addImplementation({ contractName, contractAlias, packageFileName });
    const customContractName = "ImplV2";
    addImplementation({ contractName: customContractName, contractAlias, packageFileName });
    const data = fs.parseJson(packageFileName);
    data.contracts[contractAlias].should.eq(customContractName);
  });

  it('should handle multiple contracts', function() {
    const customAlias1 = "Impl";
    const customContractName1 = "ImplV1";
    const customAlias2 = "AnotherImpl";
    const customContractName2 = "AnotherImplV1";
    addImplementation({ contractName: customContractName1, contractAlias: customAlias1, packageFileName });
    addImplementation({ contractName: customContractName2, contractAlias: customAlias2, packageFileName });
    const data = fs.parseJson(packageFileName);
    data.contracts[customAlias1].should.eq(customContractName1);
    data.contracts[customAlias2].should.eq(customContractName2);
  });

  it('should use a default alias if one is not provided', function() {
    addImplementation({ contractName, contractAlias: undefined, packageFileName });
    const data = fs.parseJson(packageFileName);
    data.contracts[contractName].should.eq(contractName);
  });

  it('should fail to add a contract that does not exist', function() {
    expect(() => addImplementation({ contractName: "NonExists", contractAlias, packageFileName })).to.throw(/not found/);
  });

  it('should fail to add an abstract contract', function() {
    expect(() => addImplementation({ contractName: "Impl", contractAlias, packageFileName })).to.throw(/abstract/);
  });

  it('should fail to add a contract with an invalid alias');
});
