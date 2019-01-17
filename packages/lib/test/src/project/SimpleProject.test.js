'use strict'
require('../../setup')

import SimpleProject from '../../../src/project/SimpleProject'
import shouldManageProxies from './ProxyProject.behaviour';
import shouldManageDependencies from './DependenciesProject.behaviour';
import shouldManageImplementations from './Implementations.behaviour';
import { noop } from 'lodash';
import Contracts from '../../../src/artifacts/Contracts';
import { Proxy } from '../../../src';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

contract('SimpleProject', function ([_, owner, another]) {
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
  
  shouldManageDependencies();
  shouldManageImplementations();
})
