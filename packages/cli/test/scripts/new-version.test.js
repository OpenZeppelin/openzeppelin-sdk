import init from "../../src/scripts/init.js";
import newVersion from "../../src/scripts/new-version.js";
import fs from 'fs';
import PackageFilesInterface from '../../src/utils/PackageFilesInterface';

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract.only('create-proxy command', function([_, owner]) {

  const from = owner;
  const appName = "MyApp";
  const defaultVersion = "0.1.0";
  const packageFileName = "package.test.zos.json";
  const files = new PackageFilesInterface(packageFileName);

  beforeEach('setup', async function() {
    await init(appName, defaultVersion, {packageFileName});
  });

  afterEach('cleanup', function() {
    console.log('cleaning up files...');
    fs.unlinkSync(packageFileName);
  });

  it('it should update the app version in the main package file', async function() {
    const version = '0.2.0';
    await newVersion(version);
    const data = files.read();
    data.version.should.eq(versoin);
  });
});
