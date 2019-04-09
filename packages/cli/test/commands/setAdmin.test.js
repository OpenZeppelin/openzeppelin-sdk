'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share';

describe('set-admin command', function() {
  stubCommands()

  itShouldParse('should call set-admin script with proxy address', 'setAdmin', 'zos set-admin 0x20 0x30 -f --network test', function(update) {
    update.should.have.been.calledWith( { proxyAddress: "0x20", newAdmin: "0x30", network: 'test', txParams: { } } )
  })

  itShouldParse('should call set-admin script with network options', 'setAdmin', 'zos set-admin 0x20 0x30 -f --network test --from 0x40', function(update) {
    update.should.have.been.calledWith( { proxyAddress: "0x20", newAdmin: "0x30", network: 'test', txParams: { from: '0x40' } } )
  })

  itShouldParse('should call set-admin script with contract name', 'setAdmin', 'zos set-admin Impl 0x30 -f --network test', function(update) {
    update.should.have.been.calledWith( { contractAlias: "Impl", newAdmin: "0x30", network: 'test', txParams: { } } )
  })

  itShouldParse('should call set-admin script with package name and contract name', 'setAdmin', 'zos set-admin OpenZeppelin/Impl 0x30 -f --network test ', function(update) {
    update.should.have.been.calledWith( { packageName: "OpenZeppelin", contractAlias: "Impl", newAdmin: "0x30", network: 'test', txParams: { } } )
  })

  itShouldParse('should call set-admin with new proxy admin owner address', 'setAdmin', 'zos set-admin 0x30 -f --network test ', function(update) {
    update.should.have.been.calledWith( { newAdmin: "0x30", network: 'test', txParams: { } } )
  })
})
