'use strict'
require('../setup')

import { FileSystem as fs, Package } from 'zos-lib'

import push from '../../src/scripts/push.js'
import freeze from '../../src/scripts/freeze.js'
import { cleanup, cleanupfn } from '../helpers/cleanup'

contract('freeze script', function([_, owner]) {
  const network = "test"
  const txParams = { from: owner }
  const packageFileName = 'test/mocks/packages/package-lib-with-contracts.zos.json'
  const networkFileName = 'test/mocks/packages/package-lib-with-contracts.zos.test.json'

  beforeEach("init and push stdlib", async function () {
    cleanup(networkFileName)
    await push({ packageFileName, network, txParams })
  })

  after(cleanupfn(networkFileName))

  it('should be marked as frozen', async function () {
    await freeze({ packageFileName, network, txParams })
    const data = fs.parseJson(networkFileName)
    data.frozen.should.be.true
  })

  it('should freeze the requested release', async function () {
    await freeze({ packageFileName, network, txParams })

    const data = fs.parseJson(networkFileName)
    const _package = await Package.fetch(data.package.address, txParams)
    await _package.isFrozen(data.version).should.eventually.be.true
  })
})
