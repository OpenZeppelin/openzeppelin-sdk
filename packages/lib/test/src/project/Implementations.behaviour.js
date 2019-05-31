'use strict';
require('../../setup');

import Proxy from '../../../src/proxy/Proxy';
import Contracts from '../../../src/artifacts/Contracts';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

export default async function() {
  describe('implementation reuse', function() {
    it('uses the same implementation for two proxies', async function() {
      const proxy1 = await this.project.createProxy(ImplV1, {
        contractName: 'DummyImplementation',
      });
      const proxy2 = await this.project.createProxy(ImplV1, {
        contractName: 'DummyImplementation',
      });
      const impl1 = await Proxy.at(proxy1).implementation();
      const impl2 = await Proxy.at(proxy2).implementation();
      impl1.should.eq(impl2);
    });

    it('uses different implementations if bytecode does not match', async function() {
      const proxy1 = await this.project.createProxy(ImplV1, {
        contractName: 'DummyImplementation',
        redeployIfChanged: true,
      });
      const proxy2 = await this.project.createProxy(ImplV2, {
        contractName: 'DummyImplementation',
        redeployIfChanged: true,
      });
      const impl1 = await Proxy.at(proxy1).implementation();
      const impl2 = await Proxy.at(proxy2).implementation();
      impl1.should.not.eq(impl2);
    });

    it('does not redeploy by default if bytecode does not match', async function() {
      const proxy1 = await this.project.createProxy(ImplV1, {
        contractName: 'DummyImplementation',
      });
      const proxy2 = await this.project.createProxy(ImplV2, {
        contractName: 'DummyImplementation',
      });
      const impl1 = await Proxy.at(proxy1).implementation();
      const impl2 = await Proxy.at(proxy2).implementation();
      impl1.should.eq(impl2);
    });

    it('redeploys if implementation is unset', async function() {
      const proxy1 = await this.project.createProxy(ImplV1, {
        contractName: 'DummyImplementation',
      });
      this.project.unsetImplementation('DummyImplementation');
      const proxy2 = await this.project.createProxy(ImplV2, {
        contractName: 'DummyImplementation',
      });
      const impl1 = await Proxy.at(proxy1).implementation();
      const impl2 = await Proxy.at(proxy2).implementation();
      impl1.should.not.eq(impl2);
    });
  });
}
