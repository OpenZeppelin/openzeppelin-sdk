'use strict'
require('../setup')

import unlink from '../../src/scripts/unlink'
import ZosPackageFile from "../../src/models/files/ZosPackageFile"

contract('unlink script', function() {
  beforeEach(async function() {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-multiple-stdlibs.zos.json')
  })

  describe('without valid parameters', function() {
    it('throws an error if no dependencies are provided', async function () {
      const dependencies = []
      await unlink({ dependencies, packageFile: this.packageFile })
        .should.be.rejectedWith('At least one dependency name must be provided.')
    })

    it('throws an error if project dependency does not exist', async function () {
      const dependencyName = 'bulbasaur-lib2'
      await unlink({ dependencies: [dependencyName], packageFile: this.packageFile })
        .should.be.rejectedWith(`Could not find a zos.json file for '${dependencyName}'. Make sure it is provided by the npm package.`)
    })
  })

  describe('with valid parameters', function() {
    it('unlinks a dependency', async function () {
      const { dependencies } = this.packageFile
      const dependencyToUnlink = 'mock-stdlib'
      const remainingDependencies = ['mock-stdlib-2', 'mock-stdlib-undeployed']

      await unlink({ dependencies: [dependencyToUnlink], packageFile: this.packageFile })

      dependencies.should.not.have.all.keys(dependencyToUnlink)
      dependencies.should.have.all.keys(remainingDependencies)
    })

    it('unlinks multiple dependencies', async function () {
      const { dependencies } = this.packageFile
      const dependenciesToUnlink = ['mock-stdlib', 'mock-stdlib-2']
      const remainingDependency = 'mock-stdlib-undeployed'

      await unlink({ dependencies: dependenciesToUnlink, packageFile: this.packageFile })

      dependencies.should.not.have.all.keys(dependenciesToUnlink)
      dependencies.should.have.all.keys(remainingDependency)
    })
  })

})
