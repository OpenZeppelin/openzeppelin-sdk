'use strict'
require('../setup')

import addAll from '../../src/scripts/add-all'
import ZosPackageFile from '../../src/models/files/ZosPackageFile'

contract('add-all script', function() {
  beforeEach('setup', async function() {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
  })

  it('should add all contracts in build contracts dir', function() {
    addAll({ packageFile: this.packageFile })

    this.packageFile.contract('ImplV1').should.eq('ImplV1')
    this.packageFile.contract('ImplV2').should.eq('ImplV2')
  })
})
