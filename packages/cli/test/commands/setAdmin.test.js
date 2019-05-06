'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share';

const newAdmin = '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24';

describe('set-admin command', function() {
  stubCommands()

  itShouldParse('should call set-admin script with proxy address', 'setAdmin', `zos set-admin 0x20 ${newAdmin} -f --network test`, function(update) {
    update.should.have.been.calledWith( { proxyAddress: "0x20", newAdmin: newAdmin, network: 'test', txParams: { } } )
  })

  itShouldParse('should call set-admin script with network options', 'setAdmin', `zos set-admin 0x20 ${newAdmin} -f --network test --from 0x40`, function(update) {
    update.should.have.been.calledWith( { proxyAddress: "0x20", newAdmin: newAdmin, network: 'test', txParams: { from: '0x40' } } )
  })

  itShouldParse('should call set-admin script with contract name', 'setAdmin', `zos set-admin Impl ${newAdmin} -f --network test`, function(update) {
    update.should.have.been.calledWith( { contractAlias: "Impl", newAdmin: newAdmin, network: 'test', txParams: { } } )
  })

  itShouldParse('should call set-admin script with package name and contract name', 'setAdmin', `zos set-admin OpenZeppelin/Impl ${newAdmin} -f --network test`, function(update) {
    update.should.have.been.calledWith( { packageName: "OpenZeppelin", contractAlias: "Impl", newAdmin: newAdmin, network: 'test', txParams: { } } )
  })

  itShouldParse('should call set-admin with new proxy admin owner address', 'setAdmin', `zos set-admin ${newAdmin} -f --network test`, function(update) {
    update.should.have.been.calledWith( { newAdmin: newAdmin, network: 'test', txParams: { } } )
  })
})
