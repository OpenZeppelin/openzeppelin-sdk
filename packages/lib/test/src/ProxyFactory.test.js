'use strict';
require('../setup');

import utils from 'web3-utils';
import Contracts from '../../src/artifacts/Contracts';
import assertRevert from '../../src/test/helpers/assertRevert';
import ProxyFactory from '../../src/proxy/ProxyFactory';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

contract('ProxyFactory model', function(accounts) {
  const [_, admin, anotherAdmin, from, anotherFrom] = accounts.map(utils.toChecksumAddress);
  const salt1 = "2";
  const salt2 = "4";
  const salt3 = "8";

  before('set implementations', async function() {
    this.implementationV1 = await ImplV1.new();
    this.implementationV2 = await ImplV2.new();
  });

  beforeEach('create factory', async function() {
    this.factory = await ProxyFactory.deploy({ from });
  });

  it('creates a proxy', async function () {
    const proxy = await this.factory.createProxy(salt1, this.implementationV1.address, admin);
    (await proxy.implementation()).should.be.equalIgnoreCase(this.implementationV1.address, "Logic contract address does not match");
    (await proxy.admin()).should.be.equalIgnoreCase(admin, "Admin address does not match");
  });

  it('initializes the created instance', async function () {
    const initData = this.implementationV1.methods.initialize(10, "foo", [20, 30]).encodeABI();
    const proxy = await this.factory.createProxy(salt1, this.implementationV1.address, admin, initData);
    const impl = await ImplV1.at(proxy.address);
    (await impl.methods.value().call()).should.eq("10");
    (await impl.methods.text().call()).should.eq("foo");
  });

  it('predicts deployment address', async function () {
    const predicted = await this.factory.getDeploymentAddress(salt1);
    const proxy = await this.factory.createProxy(salt1, this.implementationV1.address, admin);
    proxy.address.should.be.equalIgnoreCase(predicted, "Predicted address does not match");
  });

  it('deploys two proxies with the same salt and different sender', async function () {
    await this.factory.createProxy(salt1, this.implementationV1.address, admin);
    const factory2 =  await ProxyFactory.fetch(this.factory.address, { from: anotherFrom });
    await factory2.createProxy(salt1, this.implementationV1.address, admin);    
  });

  it('deploys two proxies with the different salt and same sender', async function () {
    await this.factory.createProxy(salt1, this.implementationV1.address, admin);
    await this.factory.createProxy(salt2, this.implementationV1.address, admin);
  });

  it('cannot deploy two proxies with the same salt and sender', async function () {
    await this.factory.createProxy(salt1, this.implementationV1.address, admin);
    await assertRevert(this.factory.createProxy(salt2, this.implementationV2.address, anotherAdmin));
  });

  it('deployment address is kept while factory creates other proxies', async function () {
    const predicted = await this.factory.getDeploymentAddress(salt1);
    await this.factory.createProxy(salt2, this.implementationV1.address, admin);
    await this.factory.createProxy(salt3, this.implementationV1.address, admin);
    const factory2 =  await ProxyFactory.fetch(this.factory.address, { from: anotherFrom });
    await factory2.createProxy(salt1, this.implementationV1.address, admin);    
    
    const newPredicted = await this.factory.getDeploymentAddress(salt1);
    newPredicted.should.equalIgnoreCase(predicted, "Predicted address changed inbetween deployments");
    
    const proxy = await this.factory.createProxy(salt1, this.implementationV1.address, admin);
    proxy.address.should.be.equalIgnoreCase(predicted, "Predicted address does not match");
  });
});
