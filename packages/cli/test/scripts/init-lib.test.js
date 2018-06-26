'use strict'
require('../setup')

import { FileSystem as fs } from 'zos-lib'
import { cleanup } from '../helpers/cleanup.js'

import initLib from '../../src/scripts/init-lib.js'
import ZosPackageFile from '../../src/models/files/ZosPackageFile'

contract('init-lib script', function() {
  const name = 'MyLib';
  const version = '0.3.0';

  beforeEach(async function () {
    this.packageFile = new ZosPackageFile('test/tmp/zos.json')
  })

  describe('created file', function() {
    it('should be marked as lib', async function () {
      await initLib({ name, version, packageFile: this.packageFile })

      this.packageFile.isLib.should.be.true;
    });

    it('should have the appropriate app name', async function() {
      await initLib({ name, version, packageFile: this.packageFile })

      this.packageFile.hasName(name).should.be.true
    });

    it('should have a default version if not specified', async function() {
      await initLib({ name, packageFile: this.packageFile })

      this.packageFile.isCurrentVersion('0.1.0').should.be.true
    });

    it('should have the appropriate version', async function() {
      await initLib({ name, version, packageFile: this.packageFile })

      this.packageFile.isCurrentVersion(version).should.be.true
    });

    it('should have an empty contracts object', async function() {
      await initLib({ name, version, packageFile: this.packageFile })

      this.packageFile.contracts.should.eql({})
    });

    it('should not overwrite existing file by default', async function () {
      fs.writeJson(this.packageFile.fileName, { name: 'previousApp', version: '0' })

      await initLib({ name, version, packageFile: this.packageFile }).should.be.rejectedWith(`Cannot overwrite existing file ${this.packageFile.fileName}`)

      cleanup(this.packageFile.fileName)
    });

    it('should overwrite existing file if requested', async function () {
      fs.writeJson(this.packageFile.fileName, { name: 'previousApp', version: '0' })

      await initLib({ name, version, force: true, packageFile: this.packageFile })

      this.packageFile.hasName(name).should.be.true
      this.packageFile.isCurrentVersion(version).should.be.true

      cleanup(this.packageFile.fileName)
    });
  });
});
