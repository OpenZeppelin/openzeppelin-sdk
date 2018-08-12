'use strict'
require('../../setup')

import FreezableImplementationDirectory from '../../../src/directory/FreezableImplementationDirectory'
import shouldBehaveLikeImplementationDirectory from './BaseImplementationDirectory.behavior';

contract('FreezableImplementationDirectory', function(accounts) {
  shouldBehaveLikeImplementationDirectory(FreezableImplementationDirectory, accounts, { onDeployed: function () {
    it('can be frozen', async function () {
      let frozen = await this.directory.isFrozen();
      frozen.should.be.false

      await this.directory.freeze().should.eventually.be.fulfilled

      frozen = await this.directory.isFrozen()
      frozen.should.be.true
    })
  }})
})