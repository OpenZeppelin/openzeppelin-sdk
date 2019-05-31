'use strict';
require('../../setup');

import Proxy from '../../../src/proxy/Proxy';
import ZWeb3 from '../../../src/artifacts/ZWeb3';
import encodeCall from '../../../src/helpers/encodeCall';
import assertRevert from '../../../src/test/helpers/assertRevert';
import shouldBehaveLikeUpgradeabilityProxy from './UpgradeabilityProxy.behaviour';
import BN from 'bignumber.js';
import utils from 'web3-utils';
import Contracts from '../../../src/artifacts/Contracts';
import shouldBehaveLikeAdminUpgradeabilityProxy from './AdminUpgradeabilityProxy.behaviour';

const Implementation1 = Contracts.getFromLocal('Implementation1');
const Implementation2 = Contracts.getFromLocal('Implementation2');
const Implementation3 = Contracts.getFromLocal('Implementation3');
const Implementation4 = Contracts.getFromLocal('Implementation4');
const MigratableMockV1 = Contracts.getFromLocal('MigratableMockV1');
const MigratableMockV2 = Contracts.getFromLocal('MigratableMockV2');
const MigratableMockV3 = Contracts.getFromLocal('MigratableMockV3');
const InitializableMock = Contracts.getFromLocal('InitializableMock');
const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
const ClashingImplementation = Contracts.getFromLocal('ClashingImplementation');
const AdminUpgradeabilityProxy = Contracts.getFromLocal(
  'AdminUpgradeabilityProxy',
);

const sendTransaction = (target, method, args, values, opts) => {
  const data = encodeCall(method, args, values);
  return ZWeb3.sendTransaction({ ...opts, to: target.address, data });
};

contract('AdminUpgradeabilityProxy', accounts => {
  accounts = accounts.map(utils.toChecksumAddress);
  const [_, proxyAdminAddress, proxyAdminOwner] = accounts;

  const createProxy = async function(logic, admin, initData, opts) {
    return AdminUpgradeabilityProxy.new(logic, admin, initData, opts);
  };

  shouldBehaveLikeUpgradeabilityProxy(
    createProxy,
    proxyAdminAddress,
    proxyAdminOwner,
  );
  shouldBehaveLikeAdminUpgradeabilityProxy(createProxy, accounts);
});
