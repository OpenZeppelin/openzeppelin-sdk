'use strict';
require('../../setup');

import Contracts from '../../../src/artifacts/Contracts';
import ImplementationDirectory from '../../../src/application/ImplementationDirectory';
import utils from 'web3-utils';

const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2');

contract('ImplementationDirectory', function(accounts) {
  accounts = accounts.map(utils.toChecksumAddress);

  const [_, owner] = accounts;
  const txParams = { from: owner };

  beforeEach('deploying implementation directory', async function() {
    this.directory = await ImplementationDirectory.deploy(txParams);
  });

  it('has an address', async function() {
    (await this.directory.address).should.not.be.null;
  });

  it('has an owner', async function() {
    (await this.directory.directoryContract.methods
      .owner()
      .call()).should.be.equal(owner);
  });

  it('can set new implementations', async function() {
    const implementation = await DummyImplementationV2.new();
    await this.directory.setImplementation(
      'DummyImplementation',
      implementation.address,
    );

    const currentImplementation = await this.directory.getImplementation(
      'DummyImplementation',
    );
    currentImplementation.should.be.eq(implementation.address);
  });

  it('can unset implementations', async function() {
    const implementation = await DummyImplementationV2.new();
    await this.directory.setImplementation(
      'DummyImplementation',
      implementation.address,
    );
    await this.directory.unsetImplementation('DummyImplementation');

    const currentImplementation = await this.directory.getImplementation(
      'DummyImplementation',
    );
    currentImplementation.should.be.zeroAddress;
  });

  it('can be frozen', async function() {
    let frozen = await this.directory.isFrozen();
    frozen.should.be.false;

    await this.directory.freeze().should.eventually.be.fulfilled;

    frozen = await this.directory.isFrozen();
    frozen.should.be.true;
  });
});
