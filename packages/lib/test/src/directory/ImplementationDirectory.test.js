'use strict'
require('../../setup')

import ImplementationDirectory from '../../../src/directory/ImplementationDirectory'
import shouldBehaveLikeImplementationDirectory from './BaseImplementationDirectory.behavior';

contract('ImplementationDirectory', function(accounts) {
  shouldBehaveLikeImplementationDirectory(ImplementationDirectory, accounts)
})
