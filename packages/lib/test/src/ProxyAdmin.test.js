'use strict';

require('../setup')
import utils from 'web3-utils';
import ProxyAdmin from '../../src/proxy/ProxyAdmin';
import Proxy from '../../src/proxy/Proxy';
import Contracts from '../../src/artifacts/Contracts';
import Contract from '../../src/artifacts/Contract';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');
const ProxyAdminContract = Contracts.getFromLocal('ProxyAdmin');

contract('ProxyAdmin class', function(accounts) {
  const [_, proxyAdminOwner, newAdmin, otherAccount] = accounts.map(utils.toChecksumAddress);
  const version = '0.0.1';
  const contentURI = '0x10';

  before(async function() {
    this.txParams = { from: proxyAdminOwner };
    this.implementationV1 = await ImplV1.new();
    this.implementationV2 = await ImplV2.new();
  });

  beforeEach(async function() {
    this.proxyAdminContract = await ProxyAdminContract.new([], this.txParams);
    this.proxyAdmin = new ProxyAdmin(this.proxyAdminContract, this.txParams);
    this.proxy = await Proxy.deploy(this.implementationV1.address, this.proxyAdmin.address, null, this.txParams);
  });

  describe('class methods', function() {
    describe('fetch', function() {
      it('sets ProxyAdmin instance', async function() {
        const proxyAdmin = ProxyAdmin.fetch(this.proxyAdmin.address, this.txParams);

        proxyAdmin.address.should.eq(this.proxyAdminContract.address);
        proxyAdmin.txParams.should.eq(this.txParams);
      });
    });

    describe('deploy', function() {
      it('sets ProxyAdmin instance', async function() {
        const proxyAdmin = await ProxyAdmin.deploy(this.txParams);

        proxyAdmin.address.should.not.be.null;
        proxyAdmin.txParams.should.eq(this.txParams);
      });
    });
  });

  describe('instance methods', function() {
    describe('#getImplementation', function() {
      it('returns proxy implementation address', async function() {
        const implementationAddress = await this.proxyAdmin.getProxyImplementation(this.proxy.address);
        implementationAddress.should.be.equal(this.implementationV1.address);
      });
    })

    describe('#setAdmin', function() {
      it('changes proxy admin', async function() {
        await this.proxyAdmin.changeProxyAdmin(this.proxy.address, newAdmin);
        const currentAdmin = await this.proxy.admin();
        currentAdmin.should.be.equal(newAdmin);
      });
    });

    describe('#upradeProxy', function() {
      context('without init args', function() {
        it('upgrades proxy', async function() {
          await this.proxyAdmin.upgradeProxy(this.proxy.address, this.implementationV2.address, ImplV2);
          const implementationAddress = await this.proxyAdmin.getProxyImplementation(this.proxy.address);
          implementationAddress.should.be.equal(this.implementationV2.address)
        });
      });

      context('with init args', function() {
        it('upgrades proxy', async function() {
          await this.proxyAdmin.upgradeProxy(this.proxy.address, this.implementationV2.address, ImplV2, 'migrate', [1337]);
          const implementationAddress = await this.proxyAdmin.getProxyImplementation(this.proxy.address);
          implementationAddress.should.be.equal(this.implementationV2.address)
        });
      });
    });
  });
});
