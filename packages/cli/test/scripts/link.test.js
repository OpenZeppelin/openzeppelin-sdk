'use strict'
require('../setup')

import linkLib from '../../src/scripts/link.js';
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
    await linkLib({ libNameVersion: 'mock-stdlib@1.1.0', packageFile: this.packageFile });
    this.shouldHaveDependency('mock-stdlib', '1.1.0');
  });

  it('should set multiple dependencies', async function () {
    await linkLib({ libNameVersion: 'mock-stdlib@1.1.0', packageFile: this.packageFile });
    await linkLib({ libNameVersion: 'mock-stdlib-2@1.2.0', packageFile: this.packageFile });
    this.shouldHaveDependency('mock-stdlib', '1.1.0');
    this.shouldHaveDependency('mock-stdlib-2', '1.2.0');
  });

  it('should overwrite a dependency version', async function () {
    await linkLib({ libNameVersion: 'mock-stdlib@^1.0.0', packageFile: this.packageFile });
    await linkLib({ libNameVersion: 'mock-stdlib@~1.1.0', packageFile: this.packageFile });
    this.shouldHaveDependency('mock-stdlib', '~1.1.0');
  });

  it('should install the dependency if requested', async function () {
    await linkLib({ libNameVersion: 'mock-stdlib@1.1.0', installLib: true, packageFile: this.packageFile });
    this.shouldHaveDependency('mock-stdlib', '1.1.0');
  });

  it('should refuse to set a dependency for a lib project', async function () {
    this.packageFile.lib = true
    await linkLib({ libNameVersion: 'mock-stdlib@1.1.0', packageFile: this.packageFile })
      .should.be.rejectedWith('Libraries cannot use a stdlib');
  });

  it('should raise an error if requested version of dependency does not match its package version', async function () {
    await linkLib({ libNameVersion: 'mock-stdlib-invalid@1.0.0', packageFile: this.packageFile })
      .should.be.rejectedWith('Required dependency version 1.0.0 does not match dependency package version 2.0.0')
  });

  it('should install the dependency if a valid version range is requested', async function () {
    await linkLib({ libNameVersion: 'mock-stdlib@^1.0.0', installLib: true, packageFile: this.packageFile });
    this.shouldHaveDependency('mock-stdlib', '^1.0.0');
  });

  it('should install the dependency if no version is requested', async function () {
    await linkLib({ libNameVersion: 'mock-stdlib', installLib: true, packageFile: this.packageFile });
    this.shouldHaveDependency('mock-stdlib', '^1.1.0');
  });

  it('should raise an error if requested version range does not match its package version', async function () {
    await linkLib({ libNameVersion: 'mock-stdlib@~1.0.0', packageFile: this.packageFile })
      .should.be.rejectedWith('Required dependency version ~1.0.0 does not match dependency package version 1.1.0')
  });
});
