'use strict';
require('../../setup');

import ZWeb3 from '../../../src/artifacts/ZWeb3';
import encodeCall from '../../../src/helpers/encodeCall';
import assertRevert from '../../../src/test/helpers/assertRevert';
import shouldBehaveLikeUpgradeabilityProxy from './UpgradeabilityProxy.behaviour';
import utils from 'web3-utils';
import Contracts from '../../../src/artifacts/Contracts';
import shouldBehaveLikeAdminUpgradeabilityProxy from './AdminUpgradeabilityProxy.behaviour';
import omit from 'lodash.omit';

const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
const InitializableAdminUpgradeabilityProxy = Contracts.getFromLocal(
  'InitializableAdminUpgradeabilityProxy',
);

contract('InitializableAdminUpgradeabilityProxy', accounts => {
  accounts = accounts.map(utils.toChecksumAddress);
  const [_, proxyAdminAddress, proxyAdminOwner] = accounts;

  const createProxy = async function(logic, admin, initData, opts) {
    const proxy = await InitializableAdminUpgradeabilityProxy.new(
      omit(opts, 'value'),
    );
    await proxy.methods.initialize(logic, admin, initData).send(opts);
    return proxy;
  };

  describe('initialization', function() {
    it('cannot be initialized twice', async function() {
      const implementation = (await DummyImplementation.new()).address;
      const proxy = await createProxy(
        implementation,
        proxyAdminAddress,
        Buffer.from(''),
      );
      await assertRevert(
        proxy.methods
          .initialize(implementation, proxyAdminAddress, Buffer.from(''))
          .send({ from: proxyAdminOwner }),
      );
    });
  });

  shouldBehaveLikeUpgradeabilityProxy(
    createProxy,
    proxyAdminAddress,
    proxyAdminOwner,
  );
  shouldBehaveLikeAdminUpgradeabilityProxy(createProxy, accounts);
});
