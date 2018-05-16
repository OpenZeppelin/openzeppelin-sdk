import { FileSystem as fs } from 'zos-lib'
import initLib from "../../src/scripts/init-lib.js"
import { cleanupfn } from "../helpers/cleanup.js";

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('init-lib command', function() {

  const packageFileName = "test/tmp/package.zos.json";
  const appName = "MyLib";
  const appVersion = "0.3.0";

  beforeEach(cleanupfn(packageFileName))
  after(cleanupfn(packageFileName))

  describe('created file', function() {
    it('should exist', async function() {
      await initLib({ name: appName, version: appVersion, packageFileName });
      fs.exists(packageFileName).should.be.true;
    });

    it('should be marked as lib', async function () {
      await initLib({ name: appName, version: appVersion, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.lib.should.be.true;
    });

    it('should have the appropriate app name', async function() {
      await initLib({ name: appName, version: appVersion, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.name.should.eq(appName);
    });

    it('should have a default version if not specified', async function() {
      await initLib({ name: appName, version: null, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.version.should.eq('0.1.0');
    });

    it('should have the appropriate version', async function() {
      await initLib({ name: appName, version: appVersion, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.version.should.eq(appVersion);
    });

    it('should have an empty contracts object', async function() {
      await initLib({ name: appName, version: null, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.contracts.should.eql({});
    });

    it('should not overwrite existing file', async function () {
      fs.writeJson(packageFileName, { app: 'previous' });
      await initLib({ name: appName, version: appVersion, packageFileName }).should.be.rejectedWith(/exist/)
    });
  });
});
