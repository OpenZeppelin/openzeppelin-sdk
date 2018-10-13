'use strict'
require('../setup')

const expect = require('chai').expect;

import ZosPackageFile from '../../src/models/files/ZosPackageFile';

contract('ZosPackageFile', function() {  
  describe('constructor', function () {
    it('creates empty file', function () {
      const file = new ZosPackageFile('test/mocks/packages/new.zos.json')
      file.data.zosversion.should.eq('2')
    })

    it('loads existing file', function () {
      const file = new ZosPackageFile('test/mocks/packages/package-with-contracts.zos.json')
      file.data.zosversion.should.eq('2')
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
