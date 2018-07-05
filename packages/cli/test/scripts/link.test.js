'use strict'
require('../setup')

import linkStdlib from '../../src/scripts/link.js';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";

const should = require('chai').should();

contract('link script', function() {

  beforeEach('setup', async function() {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-stdlib.zos.json')
  });

  it('should set stdlib', async function () {
    await linkStdlib({ stdlibNameVersion: 'mock-stdlib@1.1.0', packageFile: this.packageFile });

    this.packageFile.stdlibName.should.eq('mock-stdlib');
    this.packageFile.stdlibVersion.should.eq('1.1.0');
  });

  it('should install the stdlib if requested', async function () {
    await linkStdlib({ stdlibNameVersion: 'mock-stdlib@1.1.0', installLib: true, packageFile: this.packageFile });

    this.packageFile.stdlibName.should.eq('mock-stdlib');
    this.packageFile.stdlibVersion.should.eq('1.1.0');
  });

  it('should refuse to set a stdlib for a lib project', async function () {
    this.packageFile.lib = true

    await linkStdlib({ stdlibNameVersion: 'mock-stdlib@1.1.0', packageFile: this.packageFile })
      .should.be.rejectedWith('Libraries cannot use a stdlib');
  });

  it('should raise an error if requested version of stdlib does not match its package version', async function () {
    await linkStdlib({ stdlibNameVersion: 'mock-stdlib-invalid@1.0.0', packageFile: this.packageFile })
      .should.be.rejectedWith('Required stdlib version 1.0.0 does not match stdlib package version 2.0.0')
  });

  it('should install the stdlib if a valid version range is requested', async function () {
    await linkStdlib({ stdlibNameVersion: 'mock-stdlib@^1.0.0', installLib: true, packageFile: this.packageFile });

    this.packageFile.stdlibName.should.eq('mock-stdlib');
    this.packageFile.stdlibVersion.should.eq('^1.0.0');
  });

  it('should install the stdlib if no version is requested', async function () {
    await linkStdlib({ stdlibNameVersion: 'mock-stdlib', installLib: true, packageFile: this.packageFile });

    this.packageFile.stdlibName.should.eq('mock-stdlib');
    this.packageFile.stdlibVersion.should.eq('^1.1.0');
  });

  it('should raise an error if requested version range does not match its package version', async function () {
    await linkStdlib({ stdlibNameVersion: 'mock-stdlib@~1.0.0', packageFile: this.packageFile })
      .should.be.rejectedWith('Required stdlib version ~1.0.0 does not match stdlib package version 1.1.0')
  });
});
