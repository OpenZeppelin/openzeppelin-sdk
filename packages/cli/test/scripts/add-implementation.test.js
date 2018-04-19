import init from "../../src/scripts/init.js";
import addImplementation from "../../src/scripts/add-implementation.js";
import fs from 'fs';
import PackageFilesInterface from '../../src/utils/PackageFilesInterface';

contract.only('add-implementation', function(accounts) {

  const packageFileName = "package.test.zos.json";
  const appName = "MyApp";
  const contractName = "MyContract_v0.sol";
  const contractAlias = "MyContract";
  const defaultVersion = "0.1.0";
  const files = new PackageFilesInterface(packageFileName);

  beforeEach('setup', function() {
    init(appName, defaultVersion, {packageFileName});
  });

  afterEach('cleanup', function() {
    console.log('cleaning up files...');
    fs.unlinkSync(packageFileName);
  });

  it('should add an implementation with an alias and a filename', function() {
    addImplementation(contractName, contractAlias, [], {packageFileName});
    const data = files.read();
    console.log(data);
    data.contracts[contractAlias].should.eq(contractName);
  });
});
