'use strict'
require('../setup')

import ZosPackageFile from '../../src/models/files/ZosPackageFile'
import { ZOS_VERSION } from '../../src/models/files/ZosVersion'

contract('ZosPackageFile', function() {  
  describe('class methods', function () {
    describe('#getLinkedDependencies', function () {
      it('gets an array of dependencies', function () {
        const dependencies = ZosPackageFile.getLinkedDependencies('test/mocks/packages/package-with-stdlib.zos.json')
        dependencies.should.not.be.empty
        dependencies.should.have.lengthOf(1)
      })
    });
  })

  describe('constructor', function () {
    it('creates empty file', function () {
      const file = new ZosPackageFile('test/mocks/packages/new.zos.json')
      file.data.zosversion.should.eq(ZOS_VERSION)
    })

    it('loads existing file', function () {
      const file = new ZosPackageFile('test/mocks/packages/package-with-contracts.zos.json')
      file.data.zosversion.should.eq(ZOS_VERSION)
      file.name.should.eq('Herbs')
      file.version.should.eq('1.1.0')
      file.contract('Impl').should.eq('ImplV1')
    })

    it('fails to load missing zosversion', function () {
      expect(() => new ZosPackageFile('test/mocks/packages/package-missing-zosversion.zos.json')).to.throw(/zos version identifier not found/)
    })

    it('fails to load unsupported zosversion', function () {
      expect(() => new ZosPackageFile('test/mocks/packages/package-unsupported-zosversion.zos.json')).to.throw(/Unrecognized zos version identifier 3/)
    })
  });
})
