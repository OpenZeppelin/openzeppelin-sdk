'use strict'
require('../setup')

import link from '../../src/scripts/link.js';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";

const should = require('chai').should();

contract('link script', function() {

  const shouldHaveDependency = function(name, version) {
    should.exist(this.packageFile.getDependencyVersion(name))
    this.packageFile.getDependencyVersion(name).should.eq(version)
  }

  beforeEach('setup', async function() {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-stdlib.zos.json')
    this.shouldHaveDependency = shouldHaveDependency.bind(this)
  });

  it('should set a dependency', async function () {
    await link({ dependencies: ['mock-stdlib@1.1.0'], packageFile: this.packageFile });
    this.shouldHaveDependency('mock-stdlib', '1.1.0');
  });

  it('should set multiple dependencies', async function () {
    const dependencies = ['mock-stdlib@1.1.0', 'mock-stdlib-2@1.2.0'];
    await link({ dependencies, packageFile: this.packageFile });
    this.shouldHaveDependency('mock-stdlib', '1.1.0');
    this.shouldHaveDependency('mock-stdlib-2', '1.2.0');
  });

  it('should overwrite a dependency version', async function () {
    const initialLibs = ['mock-stdlib@^1.0.0', 'mock-stdlib-2@1.2.0']
    const withUpdatedLib = ['mock-stdlib@~1.1.0']

    await link({ dependencies: initialLibs, packageFile: this.packageFile });
    await link({ dependencies: withUpdatedLib, packageFile: this.packageFile });

    this.shouldHaveDependency('mock-stdlib', '~1.1.0');
    this.shouldHaveDependency('mock-stdlib-2', '1.2.0');
  });

  it('should install all dependencies if requested', async function () {
    const dependencies = ['mock-stdlib@1.1.0', 'mock-stdlib-2@1.2.0']

    await link({ dependencies, installLib: true, packageFile: this.packageFile });

    this.shouldHaveDependency('mock-stdlib', '1.1.0');
    this.shouldHaveDependency('mock-stdlib-2', '1.2.0');
  });

  it('should raise an error if requested version of dependency does not match its package version', async function () {
    await link({ dependencies: ['mock-stdlib-invalid@1.0.0'], packageFile: this.packageFile })
      .should.be.rejectedWith('Required dependency version 1.0.0 does not match version 2.0.0')
  });

  it('should install the dependency if a valid version range is requested', async function () {
    await link({ dependencies: ['mock-stdlib@^1.0.0'], installLib: true, packageFile: this.packageFile });
    this.shouldHaveDependency('mock-stdlib', '^1.0.0');
  });

  it('should install the dependency if no version is requested', async function () {
    await link({ dependencies: ['mock-stdlib'], installLib: true, packageFile: this.packageFile });
    this.shouldHaveDependency('mock-stdlib', '^1.1.0');
  });

  it('should raise an error if requested version range does not match its package version', async function () {
    await link({ dependencies: ['mock-stdlib@~1.0.0'], packageFile: this.packageFile })
      .should.be.rejectedWith('Required dependency version ~1.0.0 does not match version 1.1.0')
  });

  it('should raise an error if requested version of dependency lacks zosversion identifier', async function () {
    await link({ dependencies: ['mock-stdlib-unsupported@1.1.0'], packageFile: this.packageFile })
      .should.be.rejectedWith(/zos version identifier not found/i)
  });
})
