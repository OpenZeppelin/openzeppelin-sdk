'use strict';

require('../../setup');

import { accounts } from '@openzeppelin/test-environment';

import { omit } from 'lodash';

import assertRevert from '../../../src/test/helpers/assertRevert';
import Contracts from '../../../src/artifacts/Contracts';
import shouldBehaveLikeUpgradeabilityProxy from './UpgradeabilityProxy.behaviour';
import shouldBehaveLikeAdminUpgradeabilityProxy from './AdminUpgradeabilityProxy.behaviour';
import { shouldUseEIP1967StorageSlot, shouldUseLegacyStorageSlot } from './storageSlot.test';
import { ADMIN_LABEL, DEPRECATED_ADMIN_LABEL } from '../../../src/utils/Constants';

const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
const InitializableAdminUpgradeabilityProxy = Contracts.getFromLocal('InitializableAdminUpgradeabilityProxy');
const ZosInitializableAdminUpgradeabilityProxy = Contracts.getFromLocal('ZosInitializableAdminUpgradeabilityProxy');

describe('InitializableAdminUpgradeabilityProxy', function() {
  const [proxyAdminAddress, proxyAdminOwner] = accounts;
  const labels = { label: ADMIN_LABEL, deprecatedLabel: DEPRECATED_ADMIN_LABEL };

  const createProxy = async function(logic, admin, initData, opts) {
    const proxy = await InitializableAdminUpgradeabilityProxy.new(omit(opts, 'value'));
    await proxy.methods.initialize(logic, admin, initData).send(opts);
    return proxy;
  };

  describe('initialization', function() {
    it('cannot be initialized twice', async function() {
      const implementation = (await DummyImplementation.new()).address;
      const proxy = await createProxy(implementation, proxyAdminAddress, Buffer.from(''));
      await assertRevert(
        proxy.methods.initialize(implementation, proxyAdminAddress, Buffer.from('')).send({ from: proxyAdminOwner }),
      );
    });
  });

  shouldUseEIP1967StorageSlot(createProxy, accounts, labels, 'admin');
  shouldBehaveLikeUpgradeabilityProxy(createProxy, proxyAdminAddress, proxyAdminOwner);
  shouldBehaveLikeAdminUpgradeabilityProxy(createProxy, accounts);

  describe('legacy InitializableAdminUpgradeabilityProxy', function() {
    const createProxy = async function(logic, admin, initData, opts) {
      const proxy = await ZosInitializableAdminUpgradeabilityProxy.new(omit(opts, 'value'));
      await proxy.methods.initialize(logic, admin, initData).send(opts);
      return proxy;
    };

    shouldUseLegacyStorageSlot(createProxy, accounts, labels, 'admin');
    shouldBehaveLikeUpgradeabilityProxy(createProxy, proxyAdminAddress, proxyAdminOwner);
    shouldBehaveLikeAdminUpgradeabilityProxy(createProxy, accounts);
  });
});
