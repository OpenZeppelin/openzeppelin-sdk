'use strict';
require('../../setup')

import shouldBehaveLikeUpgradeabilityProxy from './UpgradeabilityProxy.behaviour'

const UpgradeabilityProxy = artifacts.require('UpgradeabilityProxy')

contract('UpgradeabilityProxy', ([_, proxyAdminOwner]) => {
  const createProxy = async function (implementation, _admin, initData, opts) {
    return UpgradeabilityProxy.new(implementation, initData, opts);
  };

  shouldBehaveLikeUpgradeabilityProxy(createProxy, undefined, proxyAdminOwner);
})
