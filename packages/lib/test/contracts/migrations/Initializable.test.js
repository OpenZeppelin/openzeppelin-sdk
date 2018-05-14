'use strict';

import assertRevert from '../../../src/helpers/assertRevert';

const assert = require('chai').assert;

const InitializableMock = artifacts.require('InitializableMock');

contract('Initializable', function () {
  beforeEach(async function () {
    this.contract = await InitializableMock.new();
  });

  it('should not be initialized before initialize', async function () {
    assert.isFalse(await this.contract.initialized());
  });

  it('should be initialized after initialize', async function () {
    await this.contract.initialize();
    assert.isTrue(await this.contract.initialized());
  });

  it('should fail to initialize twice', async function () {
    await this.contract.initialize();
    await assertRevert(this.contract.initialize());
    assert.isTrue(await this.contract.initialized());
  });

});
