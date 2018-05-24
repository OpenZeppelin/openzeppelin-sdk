'use strict'
require('../setup')

import { FileSystem as fs } from 'zos-lib'
import init from "../../src/scripts/init.js"
import { cleanupfn } from "../helpers/cleanup.js";

contract('init script', function() {
  const appName = "MyApp";
  const packageFileName = "test/tmp/zos.json";
  const appVersion = "0.3.0";

  beforeEach(cleanupfn(packageFileName))
  after(cleanupfn(packageFileName))

  describe('created file', function() {
    it('should exist', async function() {
      await init({ name: appName, version: appVersion, packageFileName });
      fs.exists(packageFileName).should.be.true;
    });

    it('should not be marked as lib', async function () {
      await init({ name: appName, version: appVersion, packageFileName });
      const data = fs.parseJson(packageFileName);
      (data.lib || false).should.not.be.true;
    });

    it('should have the appropriate app name', async function() {
      await init({ name: appName, version: appVersion, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.name.should.eq(appName);
    });

    it('should have a default version if not specified', async function() {
      await init({ name: appName, version: null, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.version.should.eq('0.1.0');
    });

    it('should have the appropriate version', async function() {
      await init({ name: appName, version: appVersion, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.version.should.eq(appVersion);
    });

    it('should have an empty contracts object', async function() {
      await init({ name: appName, version: null, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.contracts.should.eql({});
    });

    it('should set stdlib', async function () {
      await init({ name: appName, version: appVersion, packageFileName, stdlibNameVersion: 'mock-stdlib@1.1.0' });
      const data = fs.parseJson(packageFileName);
      data.stdlib.name.should.eq('mock-stdlib');
      data.stdlib.version.should.eq('1.1.0');
    });

    it('should not overwrite existing file by default', async function () {
      fs.writeJson(packageFileName, { app: 'previous' });
      await init({ name: appName, version: appVersion, packageFileName }).should.be.rejectedWith(/exist/)
    });

    it('should overwrite existing file if requested', async function () {
      fs.writeJson(packageFileName, { app: 'previous' });
      await init({ name: appName, version: appVersion, packageFileName, force: true })

      const data = fs.parseJson(packageFileName);
      data.name.should.eq(appName);
      data.version.should.eq(appVersion);
    });
  });
});
