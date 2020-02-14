'use strict';
require('../../setup');

import { accounts } from '@openzeppelin/test-environment';

import ProxyAdmin from '../../../src/proxy/ProxyAdmin';
import ProxyAdminProject from '../../../src/project/ProxyAdminProject';
import shouldManageProxies from './ProxyProject.behaviour';
import shouldManageDependencies from './DependenciesProject.behaviour';
import shouldManageImplementations from './Implementations.behaviour';
import shouldManageAdminProxy from './AdminProxy.behaviour';
import Contracts from '../../../src/artifacts/Contracts';
import { noop } from 'lodash';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

async function setImplementations() {
  await this.project.setImplementation(ImplV1, 'DummyImplementation');
  await this.project.setImplementation(ImplV2, 'DummyImplementationV2');
}

describe('ProxyAdminProject', function() {
  const [proxyAdminOwner, another] = accounts;
  const name = 'MyProxyAdminProject';
  const txParams = { from: proxyAdminOwner };

  beforeEach('initializing', async function() {
    this.proxyAdminOwner = proxyAdminOwner;
    this.proxyAdmin = await ProxyAdmin.deploy(txParams);
    this.adminAddress = this.proxyAdmin.address;
    this.project = new ProxyAdminProject(name, this.proxyAdmin, null, {
      from: proxyAdminOwner,
    });
  });

  describe('class methods', function() {
    describe('#fetch', function() {
      it('returns ProxyAdminProject instance', async function() {
        const project = await ProxyAdminProject.fetch(name, txParams, this.adminAddress);
        project.should.be.instanceof(ProxyAdminProject);
      });
    });
  });

  describe('without setImplementation', function() {
    shouldManageProxies({
      supportsNames: false,
      otherAdmin: another,
      setImplementations: noop,
    });
  });

  describe('with setImplementation', function() {
    shouldManageProxies({
      supportsNames: true,
      otherAdmin: another,
      setImplementations,
    });

    it('unsets an implementation', async function() {
      await this.project.setImplementation(ImplV1, 'DummyImplementation');
      this.project.unsetImplementation('DummyImplementation');
      this.project.implementations.should.not.have.key('DummyImplementation');
    });
  });

  shouldManageDependencies();
  shouldManageImplementations();
  shouldManageAdminProxy({
    otherAdmin: another,
    setImplementations,
  });
});
