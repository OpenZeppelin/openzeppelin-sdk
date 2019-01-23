'use strict'
process.env.NODE_ENV = 'test'

import ZWeb3 from '../src/artifacts/ZWeb3'
import Contracts from '../src/artifacts/Contracts'
import { helpers } from '../src/test'

ZWeb3.initialize(web3.currentProvider)
setArtifactDefaults()

require('chai')
  .use(require('chai-as-promised')) // TODO: Remove this dependency
  .use(require('chai-bignumber')(web3.BigNumber))
  .use(helpers.assertions)
  .should()

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
