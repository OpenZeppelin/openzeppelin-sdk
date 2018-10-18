import { FileSystem as fs } from 'zos-lib'
import log from '../../../src/helpers/log'
import deploy from '../../../src/scripts/deploy'
import ZosPackageFile from 'zos/lib/models/files/ZosPackageFile'
import { verifyAppSetup, verifyJurisdiction, verifyTPLConfiguration, verifyVouching, verifyZEPToken, verifyOrganizationsValidator } from '../../../src/scripts/verify'

contract('deploy', function([_, owner]) {
  log.silent(true)
  const network = 'test'
  const txParams = { from: owner }
  const options = { network, txParams }

  before('deploy', async function () {
    await deploy(options)
    this.networkFile = (new ZosPackageFile()).networkFile(network)
  })

  it('setups a zeppelin os app', async function() {
    assert(await verifyAppSetup(this.networkFile))
  })

  it('deploys a basic jurisdiction', async function() {
    assert(await verifyJurisdiction(this.networkFile, txParams))
  })

  it('deploys a ZEP token', async function() {
    assert(await verifyZEPToken(this.networkFile, txParams))
  })

  it('deploys a vouching contract', async function() {
    assert(await verifyVouching(this.networkFile, txParams))
  })

  it('deploys an Organizations Validator', async function() {
    assert(await verifyOrganizationsValidator(this.networkFile, txParams))
  })

  it('configures TPL', async function() {
    assert(await verifyTPLConfiguration(this.networkFile, txParams))
  })

  after('remove zos test json', () => fs.remove('zos.test.json'))
  after('remove zos test summary json', () => fs.remove('zos.summary.test.json'))
})
