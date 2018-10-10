import { FileSystem as fs } from 'zos-lib'
import log from '../../../src/helpers/log'
import deploy from '../../../src/scripts/deploy'
import ZosPackageFile from 'zos/lib/models/files/ZosPackageFile'
import { verifyAppSetup, verifyJurisdiction, verifyTPLConfiguration, verifyVouching, verifyZEPToken, verifyZEPValidator } from '../../../src/scripts/verify'

contract.only('deploy', function([_, owner]) {
  // log.silent(true)
  const network = 'test'
  const txParams = { from: owner }
  const options = { network, txParams }
  const networkFile = (new ZosPackageFile()).networkFile(network)

  beforeEach('deploy', async () => await deploy(options))

  afterEach('remove zos test json', () => fs.exists('zos.test.json') && fs.remove('zos.test.json'))

  it('setups a zeppelin os app', async function() {
    assert(await verifyAppSetup(networkFile))
  })

  it('deploys a basic jurisdiction', async function() {
    assert(await verifyJurisdiction(networkFile, txParams))
  })

  it('deploys a ZEP token', async function() {
    assert(await verifyZEPToken(networkFile, txParams))
  })

  it('deploys a vouching contract', async function() {
    assert(await verifyVouching(networkFile, txParams))
  })

  it('deploys a ZEP validator', async function() {
    assert(await verifyZEPValidator(networkFile, txParams))
  })

  it('configures TPL', async function() {
    assert(await verifyTPLConfiguration(networkFile, txParams))
  })
})
