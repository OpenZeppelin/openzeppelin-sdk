'use strict'
require('../setup')

import { FileSystem as fs } from 'zos-lib'
import { cleanup, cleanupfn } from '../helpers/cleanup'

import init from '../../src/scripts/init'
import ZosPackageFile from '../../src/models/files/ZosPackageFile'

contract('init script', function() {
  const name = 'MyApp';
  const version = '0.3.0';
  const tmpDir = 'test/tmp';

  before('create tmp dir', () => fs.createDir(tmpDir))
  after('cleanup tmp dir', cleanupfn(tmpDir))

  beforeEach('create package file', async function() {
    this.packageFile = new ZosPackageFile(`${tmpDir}/zos.json`)
  })

  it('should default to unpublished apps', async function () {
    await init({ name, version, packageFile: this.packageFile });
    this.packageFile.isPublished.should.eq(false)
  });

  function testInit(publish) {
    it('should have correct publish mark', async function () {
      await init({ publish, name, version, packageFile: this.packageFile });
      this.packageFile.isPublished.should.eq(publish)
    });

    it('should have the appropriate app name', async function() {
      await init({ publish, name, version, packageFile: this.packageFile });
      this.packageFile.hasName(name).should.be.true
    });

    it('should have a default version if not specified', async function() {
      await init({ publish, name, packageFile: this.packageFile });
      this.packageFile.isCurrentVersion('0.1.0').should.be.true
    });

    it('should have the appropriate version', async function() {
      await init({ publish, name, version, packageFile: this.packageFile });
      this.packageFile.isCurrentVersion(version).should.be.true
    });

    it('should have an empty contracts object', async function() {
      await init({ publish, name, version, packageFile: this.packageFile });
      this.packageFile.contracts.should.be.eql({})
    });

    it('should set dependency', async function () {
      await init({ publish, name, version, dependencies: ['mock-stdlib@1.1.0'], packageFile: this.packageFile });
      this.packageFile.getDependencyVersion('mock-stdlib').should.eq('1.1.0')
    });

    it('should not overwrite existing file by default', async function () {
      fs.writeJson(this.packageFile.fileName, { name: 'previousApp' })
      await init({ publish, name, version, packageFile: this.packageFile }).should.be.rejectedWith(`Cannot overwrite existing file ${this.packageFile.fileName}`)

      cleanup(this.packageFile.fileName)
    });

    it('should overwrite existing file if requested', async function () {
      fs.writeJson(this.packageFile.fileName, { name: 'previousApp', version: '0' })
      await init({ publish, name, version, force: true, packageFile: this.packageFile })

      this.packageFile.hasName(name).should.be.true
      this.packageFile.isCurrentVersion(version).should.be.true

      cleanup(this.packageFile.fileName)
    });
  };

  describe('for app', function () {
    testInit(false)
  })

  describe('for full', function () {
    testInit(true)
  })
});
