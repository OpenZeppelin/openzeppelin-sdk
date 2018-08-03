'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('add command', function() {

  stubCommands()

  itShouldParse('should call add script with an alias and a filename', 'add', 'zos add ImplV1:Impl --skip-compile', function(add) {
    add.should.have.been.calledWithExactly({ contractsData: [ { name: 'ImplV1', alias: 'Impl' } ] })
  })
  
  itShouldParse('should call add-all script when passing --all option', 'addAll', 'zos add --all --skip-compile', function(addAll) {
    addAll.should.have.been.calledWithExactly( { } )
  })

  itShouldParse('should call push script when passing --push option', 'push', 'zos add --all --push test --skip-compile', function(push) {
    push.should.have.been.calledWithExactly({ deployStdlib: undefined, reupload: undefined, network: 'test', txParams: {} })
  })

})
