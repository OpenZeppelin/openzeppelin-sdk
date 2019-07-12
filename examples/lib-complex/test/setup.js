'use strict'
process.env.NODE_ENV = 'test'

import { ZWeb3, Contracts } from '@openzeppelin/upgrades'

ZWeb3.initialize(web3.currentProvider)

Contracts.setArtifactsDefaults({
  gas: 6721975,
  gasPrice: 100000000000
})

require('chai')
  .use(require('@openzeppelin/upgrades').assertions)
  .should()
