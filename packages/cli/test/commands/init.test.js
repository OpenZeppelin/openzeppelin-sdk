'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('init command', function() {

  stubCommands()

  itShouldParse('should call init script with name, version and lib', 'init', 'zos init MyApp 0.2.0 --force --no-install --link mock-stdlib@1.1.0,mock-stdlib2@1.2.0', function(init) {
    const libs = ['mock-stdlib@1.1.0', 'mock-stdlib2@1.2.0']
    init.should.have.been.calledWithExactly({ name: 'MyApp', version: '0.2.0', libs, installLibs: false, force: true, full: undefined })
  })

  itShouldParse('should call push script when passing --push option', 'push', 'zos init MyApp 0.2.0 --push test', function(push) {
    push.should.have.been.calledWithExactly({ full: undefined, deployLibs: undefined, force: undefined, reupload: undefined, network: 'test', txParams: {} })
  })

  itShouldParse('should call init script with light flag', 'init', 'zos init MyApp 0.2.0 --full', function(init) {
    init.should.have.been.calledWithExactly({ name: 'MyApp', version: '0.2.0', full: true, force: undefined, installLibs: undefined, libs: [] })
  })

})
