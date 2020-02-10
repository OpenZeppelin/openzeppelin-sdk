'use strict';

require('../../setup');

import { without } from 'lodash';

import Proxy from '../../../src/proxy/Proxy';
import ZWeb3 from '../../../src/artifacts/ZWeb3';
import encodeCall from '../../../src/helpers/encodeCall';
import assertRevert from '../../../src/test/helpers/assertRevert';
import Contracts from '../../../src/artifacts/Contracts';
import utils from 'web3-utils';
import { DEPRECATED_IMPLEMENTATION_LABEL, IMPLEMENTATION_LABEL } from '../../../src/utils/Constants';

const DummyImplementation = Contracts.getFromLocal('DummyImplementation');

export default function shouldBehaveLikeUpgradeabilityProxy(createProxy, proxyAdminAddress, proxyCreator) {
  it('cannot be initialized with a non-contract address', async function() {
    const nonContractAddress = proxyCreator;
    const initializeData = Buffer.from('');
    await assertRevert(
      createProxy(nonContractAddress, proxyAdminAddress, initializeData, {
        from: proxyCreator,
      }),
    );
  });

  before('deploy implementation', async function() {
    this.implementation = utils.toChecksumAddress((await DummyImplementation.new()).address);
  });

  const assertProxyInitialization = function({ value, balance }) {
    it('sets the implementation address', async function() {
      const implementation = await Proxy.at(this.proxy).implementation();
      implementation.should.be.equal(this.implementation);
    });

    it('initializes the proxy', async function() {
      const dummy = await DummyImplementation.at(this.proxy);
      (await dummy.methods.value().call()).should.eq(value.toString());
    });

    it('has expected balance', async function() {
      (await ZWeb3.eth.getBalance(this.proxy)).should.eq(balance.toString());
    });
  };

  describe('without initialization', function() {
    const initializeData = Buffer.from('');

    describe('when not sending balance', function() {
      beforeEach('creating proxy', async function() {
        this.proxy = (
          await createProxy(this.implementation, proxyAdminAddress, initializeData, {
            from: proxyCreator,
          })
        ).address;
      });

      assertProxyInitialization({ value: 0, balance: 0 });
    });

    describe('when sending some balance', function() {
      const value = 10e5;

      beforeEach('creating proxy', async function() {
        this.proxy = (
          await createProxy(this.implementation, proxyAdminAddress, initializeData, {
            from: proxyCreator,
            value,
          })
        ).address;
      });

      assertProxyInitialization({ value: 0, balance: value });
    });
  });

  describe('initialization without parameters', function() {
    describe('non payable', function() {
      const expectedInitializedValue = 10;
      const initializeData = encodeCall('initializeNonPayable', [], []);

      describe('when not sending balance', function() {
        beforeEach('creating proxy', async function() {
          this.proxy = (
            await createProxy(this.implementation, proxyAdminAddress, initializeData, {
              from: proxyCreator,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function() {
        const value = 10e5;

        it('reverts', async function() {
          await assertRevert(
            createProxy(this.implementation, proxyAdminAddress, initializeData, { from: proxyCreator, value }),
          );
        });
      });
    });

    describe('payable', function() {
      const expectedInitializedValue = 100;
      const initializeData = encodeCall('initializePayable', [], []);

      describe('when not sending balance', function() {
        beforeEach('creating proxy', async function() {
          this.proxy = (
            await createProxy(this.implementation, proxyAdminAddress, initializeData, {
              from: proxyCreator,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function() {
        const value = 10e5;

        beforeEach('creating proxy', async function() {
          this.proxy = (
            await createProxy(this.implementation, proxyAdminAddress, initializeData, {
              from: proxyCreator,
              value,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: value,
        });
      });
    });
  });

  describe('initialization with parameters', function() {
    describe('non payable', function() {
      const expectedInitializedValue = 10;
      const initializeData = encodeCall('initializeNonPayable', ['uint256'], [expectedInitializedValue]);

      describe('when not sending balance', function() {
        beforeEach('creating proxy', async function() {
          this.proxy = (
            await createProxy(this.implementation, proxyAdminAddress, initializeData, {
              from: proxyCreator,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function() {
        const value = 10e5;

        it('reverts', async function() {
          await assertRevert(
            createProxy(this.implementation, proxyAdminAddress, initializeData, { from: proxyCreator, value }),
          );
        });
      });
    });

    describe('payable', function() {
      const expectedInitializedValue = 42;
      const initializeData = encodeCall('initializePayable', ['uint256'], [expectedInitializedValue]);

      describe('when not sending balance', function() {
        beforeEach('creating proxy', async function() {
          this.proxy = (
            await createProxy(this.implementation, proxyAdminAddress, initializeData, {
              from: proxyCreator,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function() {
        const value = 10e5;

        beforeEach('creating proxy', async function() {
          this.proxy = (
            await createProxy(this.implementation, proxyAdminAddress, initializeData, {
              from: proxyCreator,
              value,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: value,
        });
      });
    });
  });
}
