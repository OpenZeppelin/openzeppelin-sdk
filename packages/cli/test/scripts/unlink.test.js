'use strict'
require('../setup')

import unlink from '../../src/scripts/unlink.js'
import ZosPackageFile from "../../src/models/files/ZosPackageFile"

contract('unlink script', function() {
  beforeEach(async function() {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-multiple-stdlibs.zos.json')
  })

  describe('without valid parameters', function() {
    it('throws an error if no libs are provided', async function () {
      const libNames = []
      await unlink({ libNames, packageFile: this.packageFile })
        .should.be.rejectedWith('At least one dependency name must be provided.')
    })

    it('throws an error if project is a library', async function () {
      this.packageFile.lib = true
      const libNames = ['mock-stdlib', 'mock-stdlib-2']
      await unlink({ libNames, packageFile: this.packageFile })
        .should.be.rejectedWith('Package projects cannot use other packages.')
    })

    it('throws an error if project library does not exist', async function () {
      const libName = 'bulbasaur-lib2'
      await unlink({ libNames: [libName], packageFile: this.packageFile })
        .should.be.rejectedWith(`Could not find a zos.json file for '${libName}'. Make sure it is provided by the npm package.`)
    })
  })

  describe('with valid parameters', function() {
    it('unlinks a dependency', async function () {
      const { dependencies } = this.packageFile
      const libToUnlink = 'mock-stdlib'
      const remainingLibs = ['mock-stdlib-2', 'mock-stdlib-undeployed']

      await unlink({ libNames: [libToUnlink], packageFile: this.packageFile })

      dependencies.should.not.have.all.keys(libToUnlink)
      dependencies.should.have.all.keys(remainingLibs)
    })

    it('unlinks multiple dependencies', async function () {
      const { dependencies } = this.packageFile
      const libNames = ['mock-stdlib', 'mock-stdlib-2']
      const remainingLib = 'mock-stdlib-undeployed'

      await unlink({ libNames, packageFile: this.packageFile })

      dependencies.should.not.have.all.keys(libNames)
      dependencies.should.have.all.keys(remainingLib)
    })
  })

})
