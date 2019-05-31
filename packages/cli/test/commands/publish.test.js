'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

describe('publish command', function() {
  stubCommands();

  itShouldParse(
    'should call publish script with network',
    'publish',
    'zos publish --network test',
    function(publish) {
      publish.should.have.been.calledWithExactly({
        network: 'test',
        txParams: {},
      });
    },
  );
});
