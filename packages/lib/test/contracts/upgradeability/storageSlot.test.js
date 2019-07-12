'use strict';

require('../../setup');

import sinon from 'sinon';
import { toBN, toHex } from 'web3-utils';

import Proxy from '../../../src/proxy/Proxy';
import ZWeb3 from '../../../src/artifacts/ZWeb3';
import Contracts from '../../../src/artifacts/Contracts';

const DummyImplementation = Contracts.getFromLocal('DummyImplementation');

export function shouldUseEIP1967StorageSlot(createProxy, accounts, labels, fnName) {
  const { label, deprecatedLabel } = labels;
  const [_, proxyAdminAddress, proxyAdminOwner] = accounts;

  beforeEach(async function() {
    this.spy = sinon.spy(Proxy.prototype, 'getStorageAt');
    this.implementation = (await DummyImplementation.new()).address;
    this.proxy = await createProxy(this.implementation, proxyAdminAddress, Buffer.from(''), {
      from: proxyAdminOwner,
    });
    this.proxyAddress = this.proxy.address;
  });

  afterEach(function() {
    this.spy.restore();
  });

  it('uses the correct storage slot', async function() {
    this.proxy = await createProxy(this.implementation, proxyAdminAddress, Buffer.from(''), {
      from: proxyAdminOwner,
    });
    const proxy = await Proxy.at(this.proxy.address);
    const address = await proxy[fnName]();
    const hashedLabel = toHex(toBN(ZWeb3.sha3(label)).sub(toBN(1)));

    fnName === 'admin' ? address.should.eq(proxyAdminAddress) : address.should.eq(this.implementation);
    this.spy.should.have.been.calledOnceWith(hashedLabel);
    this.spy.should.have.not.been.calledWith(ZWeb3.sha3(deprecatedLabel));
  });
}

export function shouldUseLegacyStorageSlot(createProxy, accounts, labels, fnName) {
  const { label, deprecatedLabel } = labels;
  const [_, proxyAdminAddress, proxyAdminOwner] = accounts;

  beforeEach(async function() {
    this.implementation = (await DummyImplementation.new()).address;
    this.proxyAddress = (await createProxy(this.implementation, proxyAdminAddress, Buffer.from(''), {
      from: proxyAdminOwner,
    })).address;
    this.proxy = await Proxy.at(this.proxyAddress);
  });

  afterEach(function() {
    this.spy.restore();
  });

  it('uses the correct storage slot', async function() {
    const proxy = await Proxy.at(this.proxy.address);
    const address = await proxy[fnName]();
    const hashedLabel = toHex(toBN(ZWeb3.sha3(label)).sub(toBN(1)));

    fnName === 'admin' ? address.should.eq(proxyAdminAddress) : address.should.eq(this.implementation);
    this.spy.should.have.been.calledWith(hashedLabel);
    this.spy.should.have.been.calledWith(ZWeb3.sha3(deprecatedLabel));
  });
}
