'use strict'
require('../setup')

import unlink from '../../src/scripts/unlink.js'
import ZosPackageFile from "../../src/models/files/ZosPackageFile"

contract('unlink script', function() {
  beforeEach(async function() {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-multiple-stdlibs.zos.json')
  })

  describe('without valid parameters', function() {
    it('throws an error if no dependencies are provided', async function () {
      const dependenciesNames = []
      await unlink({ dependenciesNames, packageFile: this.packageFile })
        .should.be.rejectedWith('At least one dependency name must be provided.')
    })

    it('throws an error if project dependency does not exist', async function () {
      const dependencyName = 'bulbasaur-lib2'
      await unlink({ dependenciesNames: [dependencyName], packageFile: this.packageFile })
        .should.be.rejectedWith(`Could not find a zos.json file for '${dependencyName}'. Make sure it is provided by the npm package.`)
    })
  })

  describe('with valid parameters', function() {
    it('unlinks a dependency', async function () {
      const { dependencies } = this.packageFile
      const dependencyToUnlink = 'mock-stdlib'
      const remainingDependencies = ['mock-stdlib-2', 'mock-stdlib-undeployed']

      await unlink({ dependenciesNames: [dependencyToUnlink], packageFile: this.packageFile })

      dependencies.should.not.have.all.keys(dependencyToUnlink)
      dependencies.should.have.all.keys(remainingDependencies)
    })

    it('unlinks multiple dependencies', async function () {
      const { dependencies } = this.packageFile
      const dependenciesNames = ['mock-stdlib', 'mock-stdlib-2']
      const remainingDependency = 'mock-stdlib-undeployed'

      await unlink({ dependenciesNames, packageFile: this.packageFile })

      dependencies.should.not.have.all.keys(dependenciesNames)
      dependencies.should.have.all.keys(remainingDependency)
    })
  })

})
