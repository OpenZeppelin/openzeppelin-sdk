'use strict';

require('../../setup');

import { accounts } from '@openzeppelin/test-environment';

import Contracts from '../../../src/artifacts/Contracts';
import shouldBehaveLikeUpgradeabilityProxy from './UpgradeabilityProxy.behaviour';
import { shouldUseEIP1967StorageSlot, shouldUseLegacyStorageSlot } from './storageSlot.test';
import { DEPRECATED_IMPLEMENTATION_LABEL, IMPLEMENTATION_LABEL } from '../../../src/utils/Constants';

const UpgradeabilityProxy = Contracts.getFromLocal('UpgradeabilityProxy');
const ZosUpgradeabilityProxy = Contracts.getFromLocal('ZosUpgradeabilityProxy');

describe('UpgradeabilityProxy', function() {
  const [proxyAdminOwner] = accounts;
  const labels = { label: IMPLEMENTATION_LABEL, deprecatedLabel: DEPRECATED_IMPLEMENTATION_LABEL };

  const createProxy = async function(implementation, _admin, initData, opts) {
    return UpgradeabilityProxy.new(implementation, initData, opts);
  };

  shouldUseEIP1967StorageSlot(createProxy, accounts, labels, 'implementation');
  shouldBehaveLikeUpgradeabilityProxy(createProxy, undefined, proxyAdminOwner);

  describe('legacy UpgradeabilityProxy', function() {
    const createProxy = async function(implementation, _admin, initData, opts) {
      return ZosUpgradeabilityProxy.new(implementation, initData, opts);
    };

    shouldUseLegacyStorageSlot(createProxy, accounts, labels, 'implementation');
    shouldBehaveLikeUpgradeabilityProxy(createProxy, undefined, proxyAdminOwner);
  });
});
