'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share'

contract('verify command', function() {
  stubCommands()

  itShouldParse('calls verify with options', 'verify', 'zos verify Impl --network rinkeby --remote etherscan --optimizer --optimizer-runs 150 --api-key AP1-K3Y', function(verify) {
    const args = { optimizer: true, optimizerRuns: '150', apiKey: 'AP1-K3Y', remote: 'etherscan', network: 'rinkeby', txParams: {} }
    verify.should.have.been.calledWithMatch('Impl', args)
  })

})
