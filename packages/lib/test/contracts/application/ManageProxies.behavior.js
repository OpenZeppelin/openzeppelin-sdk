'use strict';

import Proxy from '../../../src/proxy/Proxy'
import ZWeb3 from '../../../src/artifacts/ZWeb3'
import encodeCall from '../../../src/helpers/encodeCall'
import assertRevert from '../../../src/test/helpers/assertRevert'
import Contracts from '../../../src/artifacts/Contracts'

const ProxyAdmin = Contracts.getFromLocal('ProxyAdmin')
const DummyImplementation = artifacts.require('DummyImplementation')
const DummyImplementationV2 = artifacts.require('DummyImplementationV2')

export default function shouldManageProxies([_, appOwner, directoryOwner, anotherAccount]) {
  const EMPTY_INITIALIZATION_DATA = ''
  const proxyAdminOwner = appOwner;

  const shouldCreateProxy = function () {
    it('sets proxy implementation', async function () {
      const implementation = await this.proxyAdmin.getProxyImplementation(this.proxyAddress)
      implementation.should.be.equal(this.implementation_v0)
    });

    it('sets proxy admin', async function () {
      const admin = await this.proxyAdmin.getProxyAdmin(this.proxyAddress)
      admin.should.be.equal(this.proxyAdmin.address)
    });

    it('delegates to implementation', async function () {
      const version = await DummyImplementation.at(this.proxyAddress).version();
      version.should.be.equal("V1");
    });
  };

  const shouldUpgradeProxy = function () {
    it('upgrades to the requested implementation', async function () {
      const implementation = await this.proxyAdmin.getProxyImplementation(this.proxyAddress)
      implementation.should.be.equal(this.implementation_v1)
    })

    it('delegates to new implementation', async function () {
      const version = await DummyImplementationV2.at(this.proxyAddress).version();
      version.should.be.equal("V2");
    });
  };

  describe('with proxy admin', function() {
    beforeEach('initialize proxy admin', async function() {
      this.proxyAdmin = await ProxyAdmin.new({ from: proxyAdminOwner });
      this.proxyAdminAddress = this.proxyAdmin.address;
    })

    describe('create', function () {
      describe('successful', function () {
        beforeEach("creating proxy", async function () {
          const { receipt } = await this.app.create(this.packageName, this.contractName, this.proxyAdmin.address, EMPTY_INITIALIZATION_DATA);
          this.proxyAddress = receipt.logs.find(l => l.event === 'ProxyCreated').args.proxy
        })

        shouldCreateProxy();
      });

      it('fails to create a proxy for unregistered package', async function () {
        await assertRevert(this.app.create("NOTEXISTS", this.contractName, this.proxyAdmin.address, EMPTY_INITIALIZATION_DATA))
      });

      it('fails to create a proxy for unregistered contract', async function () {
        await assertRevert(this.app.create(this.packageName, "NOTEXISTS", this.proxyAdmin.address, EMPTY_INITIALIZATION_DATA))
      });
    });

    describe('createAndCall', function () {
      const value = 1e5
      const initializeData = encodeCall('initializePayable', ['uint256'], [42])
      const incorrectData = encodeCall('wrong', ['uint256'], [42])

      describe('successful', function () {
        beforeEach("creating proxy", async function () {
          const { receipt } = await this.app.create(this.packageName, this.contractName, this.proxyAdmin.address, initializeData, { value })
          this.proxyAddress = receipt.logs.find(l => l.event === 'ProxyCreated').args.proxy
        })

        shouldCreateProxy();

        it('initializes the proxy', async function() {
          const value = await DummyImplementation.at(this.proxyAddress).value()
          value.should.be.bignumber.eq(42)
        })

        it('sends given value to the proxy', async function() {
          const balance = await ZWeb3.getBalance(this.proxyAddress)
          balance.should.be.bignumber.eq(value)
        })
      });

      it('fails to create a proxy for unregistered package', async function () {
        await assertRevert(this.app.create("NOTEXISTS", this.contractName, this.proxyAdmin.address, initializeData, { value }))
      });

      it('fails to create a proxy for unregistered contract', async function () {
        await assertRevert(this.app.create(this.packageName, "NOTEXISTS", this.proxyAdmin.address, initializeData, { value }))
      });

      it('fails to create a proxy with invalid initialize data', async function () {
        await assertRevert(this.app.create(this.packageName, this.contractName, this.proxyAdmin.address, incorrectData, { value }))
      });
    });

    describe('upgrade', function () {
      beforeEach("creating proxy", async function () {
        const { receipt } = await this.app.create(this.packageName, this.contractName, this.proxyAdmin.address, EMPTY_INITIALIZATION_DATA, { from: appOwner })
        this.proxyAddress = receipt.logs.find(l => l.event === 'ProxyCreated').args.proxy
      })

      describe('successful', async function () {
        beforeEach("upgrading proxy", async function () {
          await this.proxyAdmin.upgrade(this.proxyAddress, this.implementation_v1, { from: proxyAdminOwner })
        });

        shouldUpgradeProxy();
      });

      // TODO: remove these tests should be deprecated, since upgrade() is not part of App anymore, and
      // also because this revers if getImplementation fails.
      it.skip('fails to upgrade a proxy for unregistered package', async function () {
        await assertRevert(this.app.upgrade(this.proxyAddress, "NOTEXISTS", this.contractNameUpdated))
      });

      it.skip('fails to upgrade a proxy for unregistered contract', async function () {
        await assertRevert(this.app.upgrade(this.proxyAddress, this.packageName, "NOTEXISTS"))
      });

      it.skip('fails to upgrade a non-proxy contract', async function () {
        await assertRevert(this.app.upgrade(this.implementation_v0, this.packageName, this.contractNameUpdated))
      });

      it.skip('fails to upgrade from another account', async function () {
        await assertRevert(this.app.upgrade(this.proxyAddress, this.packageName, this.contractNameUpdated, { from: anotherAccount }))
      });
    });

    describe('upgradeAndCall', function () {
      const value = 1e5
      const initializeData = encodeCall('initializePayable', ['uint256'], [42])
      const migrateData = encodeCall('migrate', ['uint256'], [84])
      const incorrectData = encodeCall('wrong', ['uint256'], [42])

      beforeEach("creating proxy", async function () {
        const { receipt } = await this.app.create(this.packageName, this.contractName, this.proxyAdmin.address, initializeData, { from: appOwner })
        this.proxyAddress = receipt.logs.find(l => l.event === 'ProxyCreated').args.proxy
      })

      describe('successful', async function () {
        beforeEach("upgrading proxy", async function () {
          await this.proxyAdmin.upgradeAndCall(this.proxyAddress, this.implementation_v1, migrateData, { value, from: proxyAdminOwner })
        });

        shouldUpgradeProxy()

        it('migrates the proxy', async function() {
          const value = await DummyImplementationV2.at(this.proxyAddress).value()
          value.should.be.bignumber.eq(84)
        })

        it('sends given value to the proxy', async function() {
          const balance = await ZWeb3.getBalance(this.proxyAddress)
          balance.should.be.bignumber.eq(value)
        })
      });


      // TODO: remove these tests should be deprecated, since upgradeAndCall() is not part of App anymore, and
      // also because this revers if getImplementation fails.
      it.skip('fails to upgrade a proxy for unregistered package', async function () {
        await assertRevert(this.app.upgradeAndCall(this.proxyAddress, "NOTEXISTS", this.contractNameUpdated, migrateData, { from: appOwner }))
      });

      it.skip('fails to upgrade a proxy for unregistered contract', async function () {
        await assertRevert(this.app.upgradeAndCall(this.proxyAddress, this.packageName, "NOTEXISTS", migrateData, { from: appOwner }))
      });

      it.skip('fails to upgrade a non-proxy contract', async function () {
        await assertRevert(this.app.upgradeAndCall(this.implementation_v0, this.packageName, this.contractNameUpdated, migrateData, { from: appOwner }))
      });

      it.skip('fails to upgrade from another account', async function () {
        await assertRevert(this.app.upgradeAndCall(this.proxyAddress, this.packageName, this.contractNameUpdated, migrateData, { from: anotherAccount }))
      });

      it.skip('fails to upgrade with incorrect migrate data', async function () {
        await assertRevert(this.app.upgradeAndCall(this.proxyAddress, this.packageName, this.contractNameUpdated, incorrectData, { from: appOwner }))
      });
    });

    describe('changeAdmin', function () {
      beforeEach("creating proxy", async function () {
        const { receipt } = await this.app.create(this.packageName, this.contractName, this.proxyAdmin.address, EMPTY_INITIALIZATION_DATA)
        this.proxyAddress = receipt.logs.find(l => l.event === 'ProxyCreated').args.proxy
      })

      it('changes admin of the proxy', async function () {
        await this.proxyAdmin.changeProxyAdmin(this.proxyAddress, anotherAccount, { from: proxyAdminOwner });
        const proxy = Proxy.at(this.proxyAddress);
        const admin = await proxy.admin();
        admin.should.be.equal(anotherAccount);
      });
    });
  })

  describe('getImplementation', function () {
    it('fetches the requested implementation from the directory', async function () {
      const implementation = await this.app.getImplementation(this.packageName, this.contractName)
      implementation.should.be.equal(this.implementation_v0)
    })

    it('returns zero if implementation does not exist', async function () {
      const implementation = await this.app.getImplementation(this.packageName, "NOTEXISTS")
      implementation.should.be.zeroAddress
    })

    it('returns zero if package name does not exist', async function () {
      const implementation = await this.app.getImplementation("NOTEXISTS", this.contractName)
      implementation.should.be.zeroAddress
    })
  })

}
