'use strict';
require('../../setup')

import shouldBehaveLikeUpgradeabilityProxy from './UpgradeabilityProxy.behaviour'

const UpgradeabilityProxy = artifacts.require('UpgradeabilityProxy')

contract('UpgradeabilityProxy', ([_, proxyAdminOwner]) => {
  shouldBehaveLikeUpgradeabilityProxy(UpgradeabilityProxy, undefined, proxyAdminOwner);
})
