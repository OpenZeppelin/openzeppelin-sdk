'use strict';
require('../setup');

import link from '../../src/scripts/link';
import ProjectFile from '../../src/models/files/ProjectFile';

const should = require('chai').should();

describe('link script', function() {
  const shouldHaveDependency = function(name, version) {
    should.exist(this.projectFile.getDependencyVersion(name));
    this.projectFile.getDependencyVersion(name).should.eq(version);
  };

  beforeEach('setup', async function() {
    this.projectFile = new ProjectFile('test/mocks/packages/package-with-stdlib.zos.json');
    this.shouldHaveDependency = shouldHaveDependency.bind(this);
  });

  it('should set a dependency', async function() {
    await link({
      dependencies: ['mock-stdlib@1.1.0'],
      projectFile: this.projectFile,
    });
    this.shouldHaveDependency('mock-stdlib', '1.1.0');
  });

  it('should set multiple dependencies', async function() {
    const dependencies = ['mock-stdlib@1.1.0', 'mock-stdlib-2@1.2.0'];
    await link({ dependencies, projectFile: this.projectFile });
    this.shouldHaveDependency('mock-stdlib', '1.1.0');
    this.shouldHaveDependency('mock-stdlib-2', '1.2.0');
  });

  it('should overwrite a dependency version', async function() {
    const initialLibs = ['mock-stdlib@^1.0.0', 'mock-stdlib-2@1.2.0'];
    const withUpdatedLib = ['mock-stdlib@~1.1.0'];

    await link({ dependencies: initialLibs, projectFile: this.projectFile });
    await link({ dependencies: withUpdatedLib, projectFile: this.projectFile });

    this.shouldHaveDependency('mock-stdlib', '~1.1.0');
    this.shouldHaveDependency('mock-stdlib-2', '1.2.0');
  });

  it('should install all dependencies if requested', async function() {
    const dependencies = ['mock-stdlib@1.1.0', 'mock-stdlib-2@1.2.0'];

    await link({
      dependencies,
      installLib: true,
      projectFile: this.projectFile,
    });

    this.shouldHaveDependency('mock-stdlib', '1.1.0');
    this.shouldHaveDependency('mock-stdlib-2', '1.2.0');
  });

  it('should raise an error if requested version of dependency does not match its package version', async function() {
    await link({
      dependencies: ['mock-stdlib-invalid@1.0.0'],
      projectFile: this.projectFile,
    }).should.be.rejectedWith('Required dependency version 1.0.0 does not match version 2.0.0');
  });

  it('should install the dependency if a valid version range is requested', async function() {
    await link({
      dependencies: ['mock-stdlib@^1.0.0'],
      installLib: true,
      projectFile: this.projectFile,
    });
    this.shouldHaveDependency('mock-stdlib', '^1.0.0');
  });

  it('should install the dependency if no version is requested', async function() {
    await link({
      dependencies: ['mock-stdlib'],
      installLib: true,
      projectFile: this.projectFile,
    });
    this.shouldHaveDependency('mock-stdlib', '^1.1.0');
  });

  it('should raise an error if requested version range does not match its package version', async function() {
    await link({
      dependencies: ['mock-stdlib@~1.0.0'],
      projectFile: this.projectFile,
    }).should.be.rejectedWith('Required dependency version ~1.0.0 does not match version 1.1.0');
  });

  it('should raise an error if requested version of dependency lacks manifestVersion identifier', async function() {
    await link({
      dependencies: ['mock-stdlib-unsupported@1.1.0'],
      projectFile: this.projectFile,
    }).should.be.rejectedWith(/Manifest version identifier not found/i);
  });
});
