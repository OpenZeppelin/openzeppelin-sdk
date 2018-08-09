'use strict';
require('../../setup')

import Contracts from '../../../src/utils/Contracts'
import assertRevert from '../../../src/test/helpers/assertRevert';

const InitializableMock = Contracts.getFromLocal('InitializableMock');

contract('Initializable', function () {
  beforeEach('deploying', async function () {
    this.contract = await InitializableMock.new();
  });

  context('before initialize', function () {
    it('initializer has not run', async function () {
      assert.isFalse(await this.contract.initializerRan());
    });
  });

  context('after initialize', function () {
    beforeEach('initializing', async function () {
      await this.contract.initialize();
    });

    it('initializer has run', async function () {
      assert.isTrue(await this.contract.initializerRan());
    });

    it('initializer does not run again', async function () {
      await assertRevert(this.contract.initialize());
    });
  });

  context('after nested initialize', function () {
    beforeEach('initializing', async function () {
      await this.contract.initializeNested();
    });

    it('initializer has run', async function () {
      assert.isTrue(await this.contract.initializerRan());
    });
  });
});
