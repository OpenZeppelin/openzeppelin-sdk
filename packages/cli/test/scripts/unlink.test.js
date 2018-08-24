'use strict'
require('../setup')

import unlink from '../../src/scripts/unlink.js'
import ZosPackageFile from "../../src/models/files/ZosPackageFile"

contract('unlink script', function() {
  beforeEach(async function() {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-multiple-stdlibs.zos.json')
  })

  it('throws an error if no libs are provided', async function () {
    const libNames = []
    await unlink({ libNames, packageFile: this.packageFile })
      .should.be.rejectedWith('At least one library name must be provided.')
  })

  it('throws an error if project is a library', async function () {
    this.packageFile.lib = true
    const libNames = ['mock-stdlib', 'mock-stdlib-2']
    await unlink({ libNames, packageFile: this.packageFile })
      .should.be.rejectedWith('Libraries do not use stdlibs.')
  })

  it('throws an error if project library does not exist', async function () {
    const libName = 'bulbasaur-lib2'
    await unlink({ libNames: [libName], packageFile: this.packageFile })
      .should.be.rejectedWith(`Could not find a zos.json file for '${libName}'. Make sure it is provided by the npm package.`)
  })

  it('unlinks a dependency in a list of dependencies', async function () {
    const { dependencies } = this.packageFile
    const libName = 'mock-stdlib'
    await unlink({ libNames: [libName], packageFile: this.packageFile })
    dependencies.should.not.have.property(libName)
  })

  it('unlinks multiple dependencies', async function () {
    const { dependencies } = this.packageFile
    const libNames = ['mock-stdlib', 'mock-stdlib-2']
    await unlink({ libNames, packageFile: this.packageFile })
    dependencies.should.not.have.property(...libNames)
  })

})
