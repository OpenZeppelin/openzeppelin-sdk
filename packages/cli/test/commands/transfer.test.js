'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share';

describe('transfer command', function() {
  stubCommands()

  itShouldParse('should call transfer script with options', 'transfer', 'zos transfer --network test --unit gwei --to 0x42 --from 0x40 --value 10', function(transfer) {
    transfer.should.have.been.calledWithExactly({ from: '0x40', to: '0x42', value: '10', unit: 'gwei', txParams: { from: '0x40' } })
  })
})
