'use strict';
require('../setup');

import unlink from '../../scripts/unlink';
import ProjectFile from '../../models/files/ProjectFile';

describe('unlink script', function() {
  beforeEach(async function() {
    this.projectFile = new ProjectFile('mocks/packages/package-with-multiple-stdlibs.zos.json');
  });

  describe('without valid parameters', function() {
    it('throws an error if no dependencies are provided', async function() {
      const dependencies = [];
      await unlink({
        dependencies,
        projectFile: this.projectFile,
      }).should.be.rejectedWith('At least one dependency name must be provided.');
    });

    it('throws an error if project dependency does not exist', async function() {
      const dependencyName = 'bulbasaur-lib2';
      await unlink({
        dependencies: [dependencyName],
        projectFile: this.projectFile,
      }).should.be.rejectedWith(`Could not find dependency ${dependencyName}.`);
    });
  });

  describe('with valid parameters', function() {
    it('unlinks a dependency', async function() {
      const { dependencies } = this.projectFile;
      const dependencyToUnlink = 'mock-stdlib';
      const remainingDependencies = ['mock-stdlib-2', 'mock-stdlib-undeployed'];

      await unlink({
        dependencies: [dependencyToUnlink],
        projectFile: this.projectFile,
      });

      dependencies.should.not.have.all.keys(dependencyToUnlink);
      dependencies.should.have.all.keys(remainingDependencies);
    });

    it('unlinks multiple dependencies', async function() {
      const { dependencies } = this.projectFile;
      const dependenciesToUnlink = ['mock-stdlib', 'mock-stdlib-2'];
      const remainingDependency = 'mock-stdlib-undeployed';

      await unlink({
        dependencies: dependenciesToUnlink,
        projectFile: this.projectFile,
      });

      dependencies.should.not.have.all.keys(dependenciesToUnlink);
      dependencies.should.have.all.keys(remainingDependency);
    });
  });
});
