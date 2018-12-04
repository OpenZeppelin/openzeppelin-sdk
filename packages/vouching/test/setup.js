process.env.NODE_ENV = 'test'

import { Contracts, ZWeb3 } from 'zos-lib'

ZWeb3.initialize(web3.currentProvider)
Contracts.setArtifactsDefaults({
  gas: 6721975,
  gasPrice: 100000000000
})

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should()
