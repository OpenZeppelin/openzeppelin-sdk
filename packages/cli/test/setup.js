process.env.NODE_ENV = 'test'

import { ZWeb3, Contracts } from 'zos-lib'
import Dependency from '../src/models/dependency/Dependency'
import ZosPackageFile from '../src/models/files/ZosPackageFile'
import ZosNetworkFile from '../src/models/files/ZosNetworkFile'

useTestZosPackageFile()
doNotInstallStdlib()
ZWeb3.initialize(web3.currentProvider)
setArtifactDefaults()

require('chai')
  .use(require('chai-as-promised'))
  .use(require('zos-lib').assertions)
  .use(require('sinon-chai'))
  .should()

function useTestZosPackageFile() {
  ZosPackageFile.prototype.write = () => {}
  ZosNetworkFile.prototype.write = () => {}
}

function doNotInstallStdlib() {
  Dependency.installFn = Dependency.install
  Dependency.install = Dependency.fromNameWithVersion
}

function setArtifactDefaults() {

  const DEFAULT_TESTING_TX_PARAMS = {
    gas: 6721975,
    gasPrice: 100000000000
  }

  const DEFAULT_COVERAGE_TX_PARAMS = {
    gas: 0xfffffffffff,
    gasPrice: 0x01,
  }

  const defaults = process.env.SOLIDITY_COVERAGE ? DEFAULT_COVERAGE_TX_PARAMS : DEFAULT_TESTING_TX_PARAMS
  Contracts.setArtifactsDefaults(defaults)
}
