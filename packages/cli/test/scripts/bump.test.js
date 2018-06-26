'use strict'
require('../setup')

import add from '../../src/scripts/add.js';
import bumpVersion from '../../src/scripts/bump.js';
import linkStdlib from '../../src/scripts/link.js';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";

contract('bum[ script', function() {
  const newVersion = '0.2.0';

  describe('on app', function () {
    beforeEach(function () {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
    })

    it('should update the app version in the main package file', async function() {
      await bumpVersion({ version: newVersion, packageFile: this.packageFile });
      
      this.packageFile.version.should.eq(newVersion);
    });

    it('should preserve added logic contracts', async function() {
      await add({ contractsData: [{ name: 'ImplV1' }], packageFile: this.packageFile });
      await bumpVersion({ version: newVersion, packageFile: this.packageFile });
      
      this.packageFile.version.should.eq(newVersion);
      this.packageFile.contract('ImplV1').should.eq('ImplV1');
    });

    it('should set stdlib', async function () {
      await bumpVersion({ version: newVersion, packageFile: this.packageFile, stdlibNameVersion: 'mock-stdlib@1.1.0' });
      
      this.packageFile.stdlibName.should.eq('mock-stdlib');
      this.packageFile.stdlibVersion.should.eq('1.1.0');
    });

    it('should preserve stdlib if none specified', async function () {
      await linkStdlib({ stdlibNameVersion: 'mock-stdlib@1.1.0', packageFile: this.packageFile });
      await bumpVersion({ version: newVersion, packageFile: this.packageFile });

      this.packageFile.stdlibName.should.eq('mock-stdlib');
      this.packageFile.stdlibVersion.should.eq('1.1.0');
    });

    it('should set new stdlib', async function () {
      await bumpVersion({ version: newVersion, packageFile: this.packageFile, stdlibNameVersion: 'mock-stdlib-2@1.2.0' });
      
      this.packageFile.stdlibName.should.eq('mock-stdlib-2');
      this.packageFile.stdlibVersion.should.eq('1.2.0');
    });
  });

  describe('on lib', function () {
    beforeEach(function () {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty-lib.zos.json')
    })

    it('should update the lib version in the main package file', async function() {
      await bumpVersion({ version: newVersion, packageFile: this.packageFile });
      
      this.packageFile.version.should.eq(newVersion);
    });

    it('should refuse to set stdlib', async function () {
      await bumpVersion({ version: newVersion, packageFile: this.packageFile, stdlibNameVersion: 'mock-stdlib@1.1.0' }).should.be.rejectedWith(/lib/);
    });
  });
});
