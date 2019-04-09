'use strict'
require('../setup')

import { ZWeb3 } from 'zos-lib';
import sinon from 'sinon';
import { stubCommands, itShouldParse } from './share';

describe('push command', function() {
  stubCommands()

  context('when network uses ganache', function() {
    itShouldParse('should call push script with options', 'push', 'zos push --network test --skip-compile -d --reset -f --deploy-proxy-admin --deploy-proxy-factory', function(push) {
      push.should.have.been.calledWithExactly({ force: true, deployDependencies: true, deployProxyAdmin: true, deployProxyFactory: true, reupload: true, network: 'test', txParams: {} })
    })
  });

  context('when network does not use ganache', function () {
    before('stub ZWeb3#isGanacheNode', function() {
      sinon.stub(ZWeb3, 'isGanacheNode').returns(false);
    })

    after('restore stub', function() {
      sinon.restore();
    })

    itShouldParse('should call push script with options', 'push', 'zos push --network test --skip-compile -d --reset -f --deploy-proxy-admin --deploy-proxy-factory', function(push) {
      push.should.have.been.calledWithExactly({ force: true, deployProxyAdmin: true, deployProxyFactory: true, deployDependencies: undefined, reupload: true, network: 'test', txParams: {} })
    })
  })
})
