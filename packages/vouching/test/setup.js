process.env.NODE_ENV = 'test'

import { Contracts, ZWeb3 } from 'zos-lib'

ZWeb3.initialize(web3.currentProvider)
setArtifactDefaults()

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

function setArtifactDefaults() {
  const from = ZWeb3.eth().accounts[0]

  const DEFAULT_TESTING_TX_PARAMS = {
    from,
    gas: 6721975,
    gasPrice: 100000000000
  }

  const DEFAULT_COVERAGE_TX_PARAMS = {
    from,
    gas: 0xfffffffffff,
    gasPrice: 0x01,
  }

  const defaults = process.env.SOLIDITY_COVERAGE ? DEFAULT_COVERAGE_TX_PARAMS : DEFAULT_TESTING_TX_PARAMS
  Contracts.setArtifactsDefaults(defaults)
}
