'use strict'
require('../setup')

import init from '../../src/scripts/init.js';
import initLib from '../../src/scripts/init-lib.js';
import bumpVersion from '../../src/scripts/bump.js';
import linkStdlib from '../../src/scripts/link.js';
import { FileSystem as fs } from 'zos-lib';
import { cleanup, cleanupfn } from '../helpers/cleanup.js';
import add from '../../src/scripts/add.js';

contract('new-version script', function() {
  const appName = 'MyApp';
  const defaultVersion = '0.1.0';
  const packageFileName = 'test/tmp/zos.json';

  describe('on app', function () {
    beforeEach('setup', async function() {
      cleanup(packageFileName)
      await init({ name: appName, version: defaultVersion, packageFileName });
    });

    after('cleanup', cleanupfn(packageFileName));

    it('should update the app version in the main package file', async function() {
      const version = '0.2.0';
      await bumpVersion({ version, packageFileName });
      fs.parseJson(packageFileName).version.should.eq(version);
    });

    it('should preserve added logic contracts', async function() {
      const version = '0.2.0';
      await add({ contractsData: [{ name: 'ImplV1' }], packageFileName });
      await bumpVersion({ version, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.version.should.eq(version);
      data.contracts['ImplV1'].should.eq('ImplV1');
    });

    it('should set stdlib', async function () {
      const version = '0.2.0';
      await bumpVersion({ version, packageFileName, stdlibNameVersion: 'mock-stdlib@1.1.0' });
      const data = fs.parseJson(packageFileName);
      data.stdlib.name.should.eq('mock-stdlib');
      data.stdlib.version.should.eq('1.1.0');
    });

    it('should preserve stdlib if none specified', async function () {
      const version = '0.2.0';
      await linkStdlib({ stdlibNameVersion: 'mock-stdlib@1.1.0', packageFileName });
      await bumpVersion({ version, packageFileName });
      const data = fs.parseJson(packageFileName);
      data.stdlib.name.should.eq('mock-stdlib');
      data.stdlib.version.should.eq('1.1.0');
    });

    it('should set new stdlib', async function () {
      const version = '0.2.0';
      await bumpVersion({ version, packageFileName, stdlibNameVersion: 'mock-stdlib-2@1.2.0' });
      const data = fs.parseJson(packageFileName);
      data.stdlib.name.should.eq('mock-stdlib-2');
      data.stdlib.version.should.eq('1.2.0');
    });
  });

  describe('on lib', function () {
    beforeEach('setup', async function() {
      cleanup(packageFileName)
      await initLib({ name: appName, version: defaultVersion, packageFileName });
    });

    after('cleanup', cleanupfn(packageFileName));

    it('should update the lib version in the main package file', async function() {
      const version = '0.2.0';
      await bumpVersion({ version, packageFileName });
      fs.parseJson(packageFileName).version.should.eq(version);
    });

    it('should refuse to set stdlib', async function () {
      const version = '0.2.0';
      await bumpVersion({ version, packageFileName, stdlibNameVersion: 'mock-stdlib@1.1.0' }).should.be.rejectedWith(/lib/);
    });
  });
});
