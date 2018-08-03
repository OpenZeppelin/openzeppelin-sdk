'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('init command', function() {

  stubCommands()

  itShouldParse('should call init script with name, version and stdlib', 'init', 'zos init MyApp 0.2.0 --link mock-stdlib@1.1.0 --force --no-install', function(init) {
    init.should.have.been.calledWithExactly({ name: 'MyApp', version: '0.2.0', stdlibNameVersion: 'mock-stdlib@1.1.0', installLib: false, force: true })
  })

  itShouldParse('should call init-lib script with name, version', 'initLib', 'zos init MyLib 0.2.0 --lib --force', function(initLib) {
    initLib.should.have.been.calledWithExactly({ name: 'MyLib', version: '0.2.0', force: true })
  })

  itShouldParse('should call push script when passing --push option', 'push', 'zos init MyApp 0.2.0 --push test', function(push) {
    push.should.have.been.calledWithExactly({ deployStdlib: undefined, reupload: undefined, network: 'test', txParams: {} })
  })

})
