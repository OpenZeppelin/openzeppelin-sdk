import { FileSystem as fs } from 'zos-lib'
import init from "../../src/scripts/init.js"
import { cleanupfn } from "../helpers/cleanup.js";

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('init command', function() {

  const packageFileName = "test/tmp/package.zos.json";
  const appName = "MyApp";
  const defaultVersion = "0.1.0";

  beforeEach(cleanupfn(packageFileName))
  after(cleanupfn(packageFileName))

  describe('created file', function() {

    it('should exist', async function() {
      await init({ name: appName, version: defaultVersion, packageFileName });
      assert.equal(true, fs.exists(packageFileName));
    });

    it('should have the appropriate app name', async function() {
      await init({ name: appName, version: defaultVersion, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.name.should.eq(appName);
    });

    it('should have a default version if not specified', async function() {
      await init({ name: appName, version: null, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.version.should.eq(defaultVersion);
    });

    it('should have the appropriate version', async function() {
      const customVersion = '0.2.24';
      await init({ name: appName, version: customVersion, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.version.should.eq(customVersion);
    });

    it('should have an empty contracts object', async function() {
      await init({ name: appName, version: null, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.contracts.should.eql({});
    });

    it('should set stdlib', async function () {
      await init({ name: appName, version: defaultVersion, packageFileName, stdlibNameVersion: 'mock-stdlib@1.1.0' });
      const data = fs.parseJson(packageFileName);
      data.stdlib.name.should.eq('mock-stdlib');
      data.stdlib.version.should.eq('1.1.0');
    });

    it('should not overwrite existing file', async function () {
      fs.writeJson(packageFileName, { app: 'previous' });
      await init({ name: appName, version: defaultVersion, packageFileName }).should.be.rejectedWith(/exist/)
    });
  });
});
