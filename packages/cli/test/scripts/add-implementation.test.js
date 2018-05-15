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
    delete contractsData[0].alias
    addImplementation({ contractsData, packageFileName });
    const data = fs.parseJson(packageFileName);
    data.contracts[contractName].should.eq(contractName);
  });

  it('should fail to add a contract that does not exist', function() {
    contractsData[0].name = 'NonExists'
    expect(() => addImplementation({ contractsData, packageFileName })).to.throw(/not found/);
  });

  it('should fail to add an abstract contract', function() {
    contractsData[0].name = 'Impl'
    expect(() => addImplementation({ contractsData, packageFileName })).to.throw(/abstract/);
  });

  xit('should fail to add a contract with an invalid alias');
});
