'use strict'
require('../setup')

import add from '../../src/scripts/add';
import bumpVersion from '../../src/scripts/bump';
import link from '../../src/scripts/link';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";

contract('bump script', function() {
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

    it('should preserve dependencies', async function () {
      await link({ dependencies: ['mock-stdlib@1.1.0'], packageFile: this.packageFile });
      await bumpVersion({ version: newVersion, packageFile: this.packageFile });

      this.packageFile.getDependencyVersion('mock-stdlib').should.eq('1.1.0');
    });
  });

});
