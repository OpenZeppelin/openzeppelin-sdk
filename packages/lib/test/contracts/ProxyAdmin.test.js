'use strict';
require('../setup');

import utils from 'web3-utils';
import Contracts from '../../src/artifacts/Contracts';
import encodeCall from '../../src/helpers/encodeCall';
import assertRevert from '../../src/test/helpers/assertRevert';
import shouldBehaveLikeOwnable from '../../src/test/behaviors/Ownable';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');
const ProxyAdmin = Contracts.getFromLocal('ProxyAdmin');
const AdminUpgradeabilityProxy = Contracts.getFromLocal('AdminUpgradeabilityProxy');

contract('ProxyAdmin', function(accounts) {
  const [_, proxyAdminOwner, newAdmin, anotherAccount] = accounts.map(utils.toChecksumAddress);

  before('set implementations', async function() {
    this.implementationV1 = await ImplV1.new();
    this.implementationV2 = await ImplV2.new();
  });

  beforeEach(async function() {
    const initializeData = Buffer.from('');
    this.proxyAdmin = await ProxyAdmin.new({ from: proxyAdminOwner });
    this.proxy = await AdminUpgradeabilityProxy.new(
      this.implementationV1.address,
      this.proxyAdmin.address,
      initializeData,
      { from: proxyAdminOwner },
    );
  });

  describe('verifies ownership', function() {
    beforeEach(function() {
      this.ownable = this.proxyAdmin;
    });

    shouldBehaveLikeOwnable(proxyAdminOwner, anotherAccount);
  });

  describe('#getProxyAdmin', function() {
    it('returns proxyAdmin as admin of the proxy', async function() {
      const admin = await this.proxyAdmin.methods
        .getProxyAdmin(this.proxy.address)
        .call();
      admin.should.be.equal(this.proxyAdmin.address);
    });
  });

  describe('#changeProxyAdmin', function() {
    it('fails to change proxy admin if its not the proxy owner', async function() {
      await assertRevert(
        this.proxyAdmin.methods
          .changeProxyAdmin(this.proxy.address, newAdmin)
          .send({ from: anotherAccount }),
      );
    });

    it('changes proxy admin', async function() {
      await this.proxyAdmin.methods
        .changeProxyAdmin(this.proxy.address, newAdmin)
        .send({ from: proxyAdminOwner });
      (await this.proxy.methods.admin().call({ from: newAdmin })).should.eq(
        newAdmin,
      );
    });
  });

  describe('#getProxyImplementation', function() {
    it('returns proxy implementation address', async function() {
      const implementationAddress = await this.proxyAdmin.methods
        .getProxyImplementation(this.proxy.address)
        .call();
      implementationAddress.should.be.equal(this.implementationV1.address);
    });
  });

  describe('#upgrade', function() {
    context('with unauthorized account', function() {
      it('fails to upgrade', async function() {
        await assertRevert(
          this.proxyAdmin.methods
            .upgrade(this.proxy.address, this.implementationV2.address)
            .send({ from: anotherAccount }),
        );
      });
    });

    context('with authorized account', function() {
      it('upgrades implementation', async function() {
        await this.proxyAdmin.methods
          .upgrade(this.proxy.address, this.implementationV2.address)
          .send({ from: proxyAdminOwner });
        const implementationAddress = await this.proxyAdmin.methods
          .getProxyImplementation(this.proxy.address)
          .call();
        implementationAddress.should.be.equal(this.implementationV2.address);
      });
    });
  });

  describe('#upgradeAndCall', function() {
    context('with unauthorized account', function() {
      it('fails to upgrade', async function() {
        const callData = encodeCall(
          'initializeNonPayable',
          ['uint256'],
          [1337],
        );
        await assertRevert(
          this.proxyAdmin.methods
            .upgradeAndCall(
              this.proxy.address,
              this.implementationV2.address,
              callData,
            )
            .send({ from: anotherAccount }),
        );
      });
    });

    context('with authorized account', function() {
      context('with invalid callData', function() {
        it('fails to upgrade', async function() {
          const callData = encodeCall('meesaNoExist', ['uint256'], [1337]);
          await assertRevert(
            this.proxyAdmin.methods
              .upgradeAndCall(
                this.proxy.address,
                this.implementationV2.address,
                callData,
              )
              .send({ from: proxyAdminOwner }),
          );
        });
      });

      context('with valid callData', function() {
        it('upgrades implementation', async function() {
          const callData = encodeCall(
            'initializeNonPayable',
            ['uint256'],
            [1337],
          );
          await this.proxyAdmin.methods
            .upgradeAndCall(
              this.proxy.address,
              this.implementationV2.address,
              callData,
            )
            .send({ from: proxyAdminOwner });
          const implementationAddress = await this.proxyAdmin.methods
            .getProxyImplementation(this.proxy.address)
            .call();
          implementationAddress.should.be.equal(this.implementationV2.address);
        });
      });
    });
  });
});
