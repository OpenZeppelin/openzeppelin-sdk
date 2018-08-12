'use strict';

import Proxy from '../../../src/utils/Proxy'
import Contracts from '../../../src/utils/Contracts'
import decodeLogs from '../../../src/helpers/decodeLogs'
import encodeCall from '../../../src/helpers/encodeCall'
import assertRevert from '../../../src/test/helpers/assertRevert'
import shouldBehaveLikeOwnable from '../../../src/test/behaviors/Ownable'

const DummyImplementation = Contracts.getFromLocal('DummyImplementation')
const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2')
const UpgradeabilityProxyFactory = Contracts.getFromLocal('UpgradeabilityProxyFactory')

export default function shouldBehaveLikeApp([_, appOwner, directoryOwner, anotherAccount]) {
  describe('ownership', function () {
    beforeEach("setting ownable", function () {
      this.ownable = this.app
    })
    shouldBehaveLikeOwnable(appOwner, anotherAccount)
  })

  const shouldCreateProxy = function () {
    it('sets proxy implementation', async function () {
      const implementation = await this.app.getProxyImplementation(this.proxyAddress)
      implementation.should.be.equal(this.implementation_v0)
    });

    it('sets proxy admin', async function () {
      const admin = await this.app.getProxyAdmin(this.proxyAddress)
      admin.should.be.equal(this.app.address)
    });

    it('delegates to implementation', async function () {
      const version = await DummyImplementation.at(this.proxyAddress).version();
      version.should.be.equal("V1");
    });
  };

  describe('create', function () {
    describe('successful', function () {
      beforeEach("creating proxy", async function () {
        const { receipt } = await this.app.create(this.packageName, this.contractName)
        this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
        this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      })

      shouldCreateProxy();
    });

    it('fails to create a proxy for unregistered package', async function () {
      await assertRevert(this.app.create("NOTEXISTS", this.contractName))
    });

    it('fails to create a proxy for unregistered contract', async function () {
      await assertRevert(this.app.create(this.packageName, "NOTEXISTS"))
    });
  });

  describe('createAndCall', function () {
    const value = 1e5
    const initializeData = encodeCall('initialize', ['uint256'], [42])
    const incorrectData = encodeCall('wrong', ['uint256'], [42])

    describe('successful', function () {
      beforeEach("creating proxy", async function () {
        const { receipt } = await this.app.createAndCall(this.packageName, this.contractName, initializeData, { value })
        this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
        this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      })

      shouldCreateProxy();

      it('initializes the proxy', async function() {
        const value = await DummyImplementation.at(this.proxyAddress).value()
        value.should.be.bignumber.eq(42)
      })

      it('sends given value to the proxy', async function() {
        const balance = await web3.eth.getBalance(this.proxyAddress)
        balance.should.be.bignumber.eq(value)
      })
    });

    it('fails to create a proxy for unregistered package', async function () {
      await assertRevert(this.app.createAndCall("NOTEXISTS", this.contractName, initializeData, { value }))
    });

    it('fails to create a proxy for unregistered contract', async function () {
      await assertRevert(this.app.createAndCall(this.packageName, "NOTEXISTS", initializeData, { value }))
    });

    it('fails to create a proxy with invalid initialize data', async function () {
      await assertRevert(this.app.createAndCall(this.packageName, this.contractName, incorrectData, { value }))
    });
  });

  const shouldUpgradeProxy = function () {
    it('upgrades to the requested implementation', async function () {
      const implementation = await this.app.getProxyImplementation(this.proxyAddress)
      implementation.should.be.equal(this.implementation_v1)
    })

    it('delegates to new implementation', async function () {
      const version = await DummyImplementationV2.at(this.proxyAddress).version();
      version.should.be.equal("V2");
    });
  };

  describe('upgrade', function () {
    beforeEach("creating proxy", async function () {
      const { receipt } = await this.app.create(this.packageName, this.contractName, { from: appOwner })
      this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
    })

    describe('successful', async function () {
      beforeEach("upgrading proxy", async function () {
        await this.app.upgrade(this.proxyAddress, this.packageName, this.contractNameUpdated, { from: appOwner })
      });

      shouldUpgradeProxy();
    });

    it('fails to upgrade a proxy for unregistered package', async function () {
      await assertRevert(this.app.upgrade(this.proxyAddress, "NOTEXISTS", this.contractNameUpdated))
    });

    it('fails to upgrade a proxy for unregistered contract', async function () {
      await assertRevert(this.app.upgrade(this.proxyAddress, this.packageName, "NOTEXISTS"))
    });

    it('fails to upgrade a non-proxy contract', async function () {
      await assertRevert(this.app.upgrade(this.implementation_v0, this.packageName, this.contractNameUpdated))
    });

    it('fails to upgrade from another account', async function () {
      await assertRevert(this.app.upgrade(this.proxyAddress, this.packageName, this.contractNameUpdated, { from: anotherAccount }))
    });
  })

  describe('upgradeAndCall', function () {
    const value = 1e5
    const initializeData = encodeCall('initialize', ['uint256'], [42])
    const migrateData = encodeCall('migrate', ['uint256'], [84])
    const incorrectData = encodeCall('wrong', ['uint256'], [42])

    beforeEach("creating proxy", async function () {
      const { receipt } = await this.app.createAndCall(this.packageName, this.contractName, initializeData, { from: appOwner })
      this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
    })

    describe('successful', async function () {
      beforeEach("upgrading proxy", async function () {
        await this.app.upgradeAndCall(this.proxyAddress, this.packageName, this.contractNameUpdated, migrateData, { value, from: appOwner })
      });

      shouldUpgradeProxy()

      it('migrates the proxy', async function() {
        const value = await DummyImplementationV2.at(this.proxyAddress).value()
        value.should.be.bignumber.eq(84)
      })

      it('sends given value to the proxy', async function() {
        const balance = await web3.eth.getBalance(this.proxyAddress)
        balance.should.be.bignumber.eq(value)
      })
    });

    it('fails to upgrade a proxy for unregistered package', async function () {
      await assertRevert(this.app.upgradeAndCall(this.proxyAddress, "NOTEXISTS", this.contractNameUpdated, migrateData, { from: appOwner }))
    });

    it('fails to upgrade a proxy for unregistered contract', async function () {
      await assertRevert(this.app.upgradeAndCall(this.proxyAddress, this.packageName, "NOTEXISTS", migrateData, { from: appOwner }))
    });

    it('fails to upgrade a non-proxy contract', async function () {
      await assertRevert(this.app.upgradeAndCall(this.implementation_v0, this.packageName, this.contractNameUpdated, migrateData, { from: appOwner }))
    });

    it('fails to upgrade from another account', async function () {
      await assertRevert(this.app.upgradeAndCall(this.proxyAddress, this.packageName, this.contractNameUpdated, migrateData, { from: anotherAccount }))
    });

    it('fails to upgrade with incorrect migrate data', async function () {
      await assertRevert(this.app.upgradeAndCall(this.proxyAddress, this.packageName, this.contractNameUpdated, incorrectData, { from: appOwner }))
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

  describe('changeAdmin', function () {
    beforeEach("creating proxy", async function () {
      const { receipt } = await this.app.create(this.packageName, this.contractName)
      this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
    })

    it('changes admin of the proxy', async function () {
      await this.app.changeProxyAdmin(this.proxyAddress, anotherAccount, { from: appOwner });
      const proxy = Proxy.at(this.proxyAddress);
      const admin = await proxy.admin();
      admin.should.be.equal(anotherAccount);
    });
  })
}