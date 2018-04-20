import init from "../../src/scripts/init.js";
import addImplementation from "../../src/scripts/add-implementation.js";
import fs from 'fs';
import PackageFilesInterface from '../../src/utils/PackageFilesInterface';
import { cleanup, cleanupfn } from "../helpers/cleanup.js";

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('add-implementation command', function(accounts) {

  const packageFileName = "package.test.zos.json";
  const appName = "MyApp";
  const contractName = "MyContract_v0.sol";
  const contractAlias = "MyContract";
  const defaultVersion = "0.1.0";
  const files = new PackageFilesInterface(packageFileName);

  beforeEach('setup', async function() {
    cleanup(packageFileName);
    await init(appName, defaultVersion, {packageFileName});
  });

  after(cleanupfn(packageFileName));

  it('should add an implementation with an alias and a filename', function() {
    addImplementation(contractName, contractAlias, {packageFileName});
    const data = files.read();
    data.contracts[contractAlias].should.eq(contractName);
  });

  it('should allow to change an existing implementation', function() {
    addImplementation(contractName, contractAlias, {packageFileName});
    const customFileName = "MyContract_v1.sol";
    addImplementation(customFileName, contractAlias, {packageFileName});
    const data = files.read();
    data.contracts[contractAlias].should.eq(customFileName);
  });

  it('should handle multiple contracts', function() {
    const customAlias1 = "MyContract";
    const customFileName1 = "MyContract_v2.sol";
    const customAlias2 = "MyOtherContract";
    const customFileName2 = "MyOtherContract_v0.sol";
    addImplementation(customFileName1, customAlias1, {packageFileName});
    addImplementation(customFileName2, customAlias2, {packageFileName});
    const data = files.read();
    data.contracts[customAlias1].should.eq(customFileName1);
    data.contracts[customAlias2].should.eq(customFileName2);
  });

  // TODO: implement
  it.skip('should use a default alias if one is not provided', function() {
    addImplementation(contractName, null, {packageFileName});
    const data = files.read();
    const expectedAlias = contractName.split('.')[0];
    console.log(data);
    data.contracts[expectedAlias].should.eq(contractName);
  });

  // TODO: test for invalid alias names
  // TODO: test for invalid solidity file names
});
