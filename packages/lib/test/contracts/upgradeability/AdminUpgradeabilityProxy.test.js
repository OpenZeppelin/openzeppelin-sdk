'use strict';

require('../../setup');

import utils from 'web3-utils';
import Contracts from '../../../src/artifacts/Contracts';
import shouldBehaveLikeUpgradeabilityProxy from './UpgradeabilityProxy.behaviour';
import shouldBehaveLikeAdminUpgradeabilityProxy from './AdminUpgradeabilityProxy.behaviour';
import { shouldUseEIP1967StorageSlot, shouldUseLegacyStorageSlot } from './storageSlot.test';
import { ADMIN_LABEL, DEPRECATED_ADMIN_LABEL } from '../../../src/utils/Constants';

const AdminUpgradeabilityProxy = Contracts.getFromLocal('AdminUpgradeabilityProxy');
const ZosAdminUpgradeabilityProxy = Contracts.getFromLocal('ZosAdminUpgradeabilityProxy');

contract('AdminUpgradeabilityProxy', function(accounts) {
  accounts = accounts.map(utils.toChecksumAddress);
  const [_, proxyAdminAddress, proxyAdminOwner] = accounts;
  const labels = { label: ADMIN_LABEL, deprecatedLabel: DEPRECATED_ADMIN_LABEL };

  const createProxy = async function(logic, admin, initData, opts) {
    return AdminUpgradeabilityProxy.new(logic, admin, initData, opts);
  };

  shouldUseEIP1967StorageSlot(createProxy, accounts, labels, 'admin');
  shouldBehaveLikeUpgradeabilityProxy(createProxy, proxyAdminAddress, proxyAdminOwner);
  shouldBehaveLikeAdminUpgradeabilityProxy(createProxy, accounts);

  describe('legacy AdminUpgradeabilityProxy', function() {
    const createProxy = async function(logic, admin, initData, opts) {
      return ZosAdminUpgradeabilityProxy.new(logic, admin, initData, opts);
    };

    shouldUseLegacyStorageSlot(createProxy, accounts, labels, 'admin');
    shouldBehaveLikeUpgradeabilityProxy(createProxy, proxyAdminAddress, proxyAdminOwner);
    shouldBehaveLikeAdminUpgradeabilityProxy(createProxy, accounts);
  });
});
