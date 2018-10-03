'use strict'
require('../setup')

const expect = require('chai').expect;

import ZosNetworkFile from '../../src/models/files/ZosNetworkFile';
import ZosPackageFile from '../../src/models/files/ZosPackageFile';

contract('ZosNetworkFile', function() {
  beforeEach('loads parent package file', function () {
    this.appPackageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
    this.libPackageFile = new ZosPackageFile('test/mocks/packages/package-empty-lib.zos.json')
  })
  
  describe('constructor', function () {
    it('creates empty file', function () {
      new ZosNetworkFile(this.appPackageFile, 'test', 'test/mocks/networks/new.test.json')
    })

    it('loads existing file', function () {
      const file = new ZosNetworkFile(this.libPackageFile, 'test', 'test/mocks/networks/network-lib-with-contract.zos.test.json')
      file.packageAddress.should.eq('0x0000000000000000000000000000000000000080')
      file.providerAddress.should.eq('0x0000000000000000000000000000000000000010')
      file.contract('Greeter').address.should.eq('0x1020')
    })

    it('fails to load unsupported zosversion', function () {
      expect(() => new ZosNetworkFile(this.appPackageFile, 'test', 'test/mocks/networks/network-unsupported-zosversion.zos.test.json')).to.throw(/Unrecognized zos version identifier 3/)
    })
  });
})
