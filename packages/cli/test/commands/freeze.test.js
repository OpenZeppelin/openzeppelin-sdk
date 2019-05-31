'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

describe('freeze command', function() {
  stubCommands();

  itShouldParse(
    'should call freeze script with network option',
    'freeze',
    'zos freeze --network test',
    function(freeze) {
      freeze.should.have.been.calledWithExactly({
        network: 'test',
        txParams: {},
      });
    },
  );
});
