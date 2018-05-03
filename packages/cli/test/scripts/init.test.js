import fs from '../../src/zos-lib/utils/FileSystem'
import init from "../../src/scripts/init.js"
import PackageFilesInterface from '../../src/utils/PackageFilesInterface';
import { cleanupfn } from "../helpers/cleanup.js";

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('init command', function() {

  const packageFileName = "package.test.zos.json";
  const appName = "MyApp";
  const defaultVersion = "0.1.0";
  const files = new PackageFilesInterface(packageFileName);

  beforeEach(cleanupfn(packageFileName))
  after(cleanupfn(packageFileName))

  describe('created file', function() {

    it('should exist', async function() {
      await init({ name: appName, version: defaultVersion, packageFileName });
      assert.equal(true, fs.exists(packageFileName));
    });

    it('should have the appropriate app name', async function() {
      await init({ name: appName, version: defaultVersion, packageFileName });
      const data = files.read();
      data.name.should.eq(appName);
    });

    it('should have a default version if not specified', async function() {
      await init({ name: appName, version: null, packageFileName });
      const data = files.read();
      data.version.should.eq(defaultVersion);
    });

    it('should have the appropriate version', async function() {
      const customVersion = '0.2.24';
      await init({ name: appName, version: customVersion, packageFileName });
      const data = files.read();
      data.version.should.eq(customVersion);
    });

    it('should have an empty contracts object', async function() {
      await init({ name: appName, version: null, packageFileName });
      const data = files.read();
      data.contracts.should.eql({});
    });

    it('should set stdlib', async function () {
      await init({ name: appName, version: defaultVersion, packageFileName, stdlibNameVersion: 'mock-stdlib@1.1.0' });
      const data = files.read();
      data.stdlib.name.should.eq('mock-stdlib');
      data.stdlib.version.should.eq('1.1.0');
    });
  });
});
