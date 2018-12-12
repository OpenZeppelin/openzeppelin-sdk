'use strict'
require('../../setup')

import SimpleProject from '../../../src/project/SimpleProject'
import shouldManageProxies from './ProxyProject.behaviour';
import shouldManageDependencies from './DependenciesProject.behaviour';
import { noop } from 'lodash';
import Contracts from '../../../src/artifacts/Contracts';
import { Proxy } from '../../../src';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

contract('SimpleProject', function (accounts) {
  const [_, owner, another] = accounts
  const name = 'MyProject'
  
  beforeEach('initializing', async function () {
    this.project = new SimpleProject(name, { from: owner })
    this.adminAddress = owner
  });
  
  describe('without setImplementation', function () {
    shouldManageProxies({
      supportsNames: false,
      otherAdmin: another,
      setImplementations: noop
    })
  });

  describe('with setImplementation', function () {
    shouldManageProxies({
      supportsNames: true,
      otherAdmin: another,
      setImplementations: async function () {
        await this.project.setImplementation(ImplV1, "DummyImplementation")
        await this.project.setImplementation(ImplV2, "DummyImplementationV2")
      }
    })

    it('unsets an implementation', async function () {
      await this.project.setImplementation(ImplV1, 'DummyImplementation')
      this.project.unsetImplementation('DummyImplementation')
      this.project.implementations.should.not.have.key('DummyImplementation')
    })
  })

  describe('implementation reuse', function () {
    it('uses the same implementation for two proxies', async function () {
      const proxy1 = await this.project.createProxy(ImplV1, { contractName: 'DummyImplementation' })
      const proxy2 = await this.project.createProxy(ImplV1, { contractName: 'DummyImplementation' })
      const impl1 = await Proxy.at(proxy1).implementation()
      const impl2 = await Proxy.at(proxy2).implementation()
      impl1.should.eq(impl2)
    })

    it('uses different implementations if bytecode does not match', async function () {
      const proxy1 = await this.project.createProxy(ImplV1, { contractName: 'DummyImplementation', redeployIfChanged: true })
      const proxy2 = await this.project.createProxy(ImplV2, { contractName: 'DummyImplementation', redeployIfChanged: true })
      const impl1 = await Proxy.at(proxy1).implementation()
      const impl2 = await Proxy.at(proxy2).implementation()
      impl1.should.not.eq(impl2)
    })

    it('does not redeploy by default if bytecode does not match', async function () {
      const proxy1 = await this.project.createProxy(ImplV1, { contractName: 'DummyImplementation' })
      const proxy2 = await this.project.createProxy(ImplV2, { contractName: 'DummyImplementation' })
      const impl1 = await Proxy.at(proxy1).implementation()
      const impl2 = await Proxy.at(proxy2).implementation()
      impl1.should.eq(impl2)
    })

    it('redeploys if implementation is unset', async function () {
      const proxy1 = await this.project.createProxy(ImplV1, { contractName: 'DummyImplementation' })
      this.project.unsetImplementation('DummyImplementation')
      const proxy2 = await this.project.createProxy(ImplV2, { contractName: 'DummyImplementation' })
      const impl1 = await Proxy.at(proxy1).implementation()
      const impl2 = await Proxy.at(proxy2).implementation()
      impl1.should.not.eq(impl2)
    })
  })

  shouldManageDependencies();
})