'use strict'
require('../setup')

import { Package } from 'zos-lib'
import push from '../../src/scripts/push.js'
import freeze from '../../src/scripts/freeze.js'
import ZosPackageFile from '../../src/models/files/ZosPackageFile'

contract('freeze script', function([_, owner]) {
  const network = 'test'
  const txParams = { from: owner }

  beforeEach('init and push lib', async function () {
    const packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts.zos.json')
    this.networkFile = packageFile.networkFile(network)
    await push({ networkFile: this.networkFile, network, txParams })
  })

  it('should be marked as frozen', async function () {
    await freeze({ networkFile: this.networkFile, network, txParams })

    this.networkFile.frozen.should.be.true
  })

  it('should freeze the requested release', async function () {
    await freeze({ networkFile: this.networkFile, network, txParams })

    const _package = await Package.fetch(this.networkFile.packageAddress, txParams)
    const frozen = await _package.isFrozen(this.networkFile.version);
    frozen.should.be.true
  })
})
