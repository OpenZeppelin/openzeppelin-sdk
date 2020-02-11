'use strict';
require('../setup');

import add from '../../src/scripts/add';
import bump from '../../src/scripts/bump';
import link from '../../src/scripts/link';
import ProjectFile from '../../src/models/files/ProjectFile';

describe('bump script', function() {
  const newVersion = '0.2.0';

  describe('on app', function() {
    beforeEach(function() {
      this.projectFile = new ProjectFile('test/mocks/packages/package-empty.zos.json');
    });

    it('should update the app version in the main package file', async function() {
      await bump({ version: newVersion, projectFile: this.projectFile });

      this.projectFile.version.should.eq(newVersion);
    });

    it('should preserve added logic contracts', async function() {
      await add({
        contractsData: [{ name: 'ImplV1' }],
        projectFile: this.projectFile,
      });
      await bump({ version: newVersion, projectFile: this.projectFile });

      this.projectFile.version.should.eq(newVersion);
      this.projectFile.contract('ImplV1').should.eq('ImplV1');
    });

    it('should preserve dependencies', async function() {
      await link({
        dependencies: ['mock-stdlib@1.1.0'],
        projectFile: this.projectFile,
      });
      await bump({ version: newVersion, projectFile: this.projectFile });

      this.projectFile.getDependencyVersion('mock-stdlib').should.eq('1.1.0');
    });
  });
});
