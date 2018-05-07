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
  const contractName = "MyContract_v0";
  const contractAlias = "MyContract";
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
    const customFileName = "MyContract_v1";
    addImplementation({ contractName: customFileName, contractAlias, packageFileName });
    const data = fs.parseJson(packageFileName);
    data.contracts[contractAlias].should.eq(customFileName);
  });

  it('should handle multiple contracts', function() {
    const customAlias1 = "MyContract";
    const customFileName1 = "MyContract_v2";
    const customAlias2 = "MyOtherContract";
    const customFileName2 = "MyOtherContract_v0";
    addImplementation({ contractName: customFileName1, contractAlias: customAlias1, packageFileName });
    addImplementation({ contractName: customFileName2, contractAlias: customAlias2, packageFileName });
    const data = fs.parseJson(packageFileName);
    data.contracts[customAlias1].should.eq(customFileName1);
    data.contracts[customAlias2].should.eq(customFileName2);
  });

  it('should use a default alias if one is not provided', function() {
    addImplementation({ contractName, contractAlias: undefined, packageFileName });
    const data = fs.parseJson(packageFileName);
    data.contracts[contractName].should.eq(contractName);
  });

  // TODO: test for invalid alias names
  // TODO: test for invalid solidity file names
});
