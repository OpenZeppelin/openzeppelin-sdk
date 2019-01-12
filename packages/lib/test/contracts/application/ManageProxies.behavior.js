'use strict';

import Proxy from '../../../src/proxy/Proxy'
import ZWeb3 from '../../../src/artifacts/ZWeb3'
import encodeCall from '../../../src/helpers/encodeCall'
import assertRevert from '../../../src/test/helpers/assertRevert'
import utils from 'web3-utils';

const DummyImplementation = artifacts.require('DummyImplementation')
const DummyImplementationV2 = artifacts.require('DummyImplementationV2')

export default function shouldManageProxies([_, appOwner, directoryOwner, anotherAccount]) {
  const EMPTY_INITIALIZATION_DATA = Buffer.from('')

  const shouldCreateProxy = function () {
    it('sets proxy implementation', async function () {
      const implementation = await this.app.methods.getProxyImplementation(this.proxyAddress).call()
      implementation.should.be.equal(this.implementation_v0)
    });

    it('sets proxy admin', async function () {
      const admin = await this.app.methods.getProxyAdmin(this.proxyAddress).call()
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
        const { events } = await this.app.methods.create(this.packageName, this.contractName, EMPTY_INITIALIZATION_DATA).send();
        this.proxyAddress = events['ProxyCreated'].returnValues.proxy
      })

      shouldCreateProxy();
    });

    it('fails to create a proxy for unregistered package', async function () {
      await assertRevert(this.app.methods.create("NOTEXISTS", this.contractName, EMPTY_INITIALIZATION_DATA).send())
    });

    it('fails to create a proxy for unregistered contract', async function () {
      await assertRevert(this.app.methods.create(this.packageName, "NOTEXISTS", EMPTY_INITIALIZATION_DATA).send())
    });
  });

  describe('createAndCall', function () {
    const value = 1e5
    const initializeData = encodeCall('initializePayable', ['uint256'], [42])
    const incorrectData = encodeCall('wrong', ['uint256'], [42])

    describe('successful', function () {
      beforeEach("creating proxy", async function () {
        const { events } = await this.app.methods.create(this.packageName, this.contractName, initializeData).send({ value })
        this.proxyAddress = events['ProxyCreated'].returnValues.proxy
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
      await assertRevert(this.app.methods.create("NOTEXISTS", this.contractName, initializeData).send({ value }))
    });

    it('fails to create a proxy for unregistered contract', async function () {
      await assertRevert(this.app.methods.create(this.packageName, "NOTEXISTS", initializeData).send({ value }))
    });

    it('fails to create a proxy with invalid initialize data', async function () {
      await assertRevert(this.app.methods.create(this.packageName, this.contractName, incorrectData).send({ value }))
    });
  });

  const shouldUpgradeProxy = function () {
    it('upgrades to the requested implementation', async function () {
      const implementation = await this.app.methods.getProxyImplementation(this.proxyAddress).call()
      implementation.should.be.equal(this.implementation_v1)
    })

    it('delegates to new implementation', async function () {
      const version = await DummyImplementationV2.at(this.proxyAddress).version();
      version.should.be.equal("V2");
    });
  };

  describe('upgrade', function () {
    beforeEach("creating proxy", async function () {
      const { events } = await this.app.methods.create(this.packageName, this.contractName, EMPTY_INITIALIZATION_DATA).send({ from: appOwner })
      this.proxyAddress = events['ProxyCreated'].returnValues.proxy
    })

    describe('successful', async function () {
      beforeEach("upgrading proxy", async function () {
        await this.app.methods.upgrade(this.proxyAddress, this.packageName, this.contractNameUpdated).send({ from: appOwner })
      });

      shouldUpgradeProxy();
    });

    it('fails to upgrade a proxy for unregistered package', async function () {
      await assertRevert(this.app.methods.upgrade(this.proxyAddress, "NOTEXISTS", this.contractNameUpdated).send())
    });

    it('fails to upgrade a proxy for unregistered contract', async function () {
      await assertRevert(this.app.methods.upgrade(this.proxyAddress, this.packageName, "NOTEXISTS").send())
    });

    it('fails to upgrade a non-proxy contract', async function () {
      await assertRevert(this.app.methods.upgrade(this.implementation_v0, this.packageName, this.contractNameUpdated).send())
    });

    it('fails to upgrade from another account', async function () {
      await assertRevert(this.app.methods.upgrade(this.proxyAddress, this.packageName, this.contractNameUpdated).send({ from: anotherAccount }))
    });
  })

  describe('upgradeAndCall', function () {
    const value = 1e5
    const initializeData = encodeCall('initializePayable', ['uint256'], [42])
    const migrateData = encodeCall('migrate', ['uint256'], [84])
    const incorrectData = encodeCall('wrong', ['uint256'], [42])

    beforeEach("creating proxy", async function () {
      const { events } = await this.app.methods.create(this.packageName, this.contractName, initializeData).send({ from: appOwner })
      this.proxyAddress = events['ProxyCreated'].returnValues.proxy
    })

    describe('successful', async function () {
      beforeEach("upgrading proxy", async function () {
        await this.app.methods.upgradeAndCall(this.proxyAddress, this.packageName, this.contractNameUpdated, migrateData).send({ value, from: appOwner })
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

    it('fails to upgrade a proxy for unregistered package', async function () {
      await assertRevert(this.app.methods.upgradeAndCall(this.proxyAddress, "NOTEXISTS", this.contractNameUpdated, migrateData).send({ from: appOwner }))
    });

    it('fails to upgrade a proxy for unregistered contract', async function () {
      await assertRevert(this.app.methods.upgradeAndCall(this.proxyAddress, this.packageName, "NOTEXISTS", migrateData).send({ from: appOwner }))
    });

    it('fails to upgrade a non-proxy contract', async function () {
      await assertRevert(this.app.methods.upgradeAndCall(this.implementation_v0, this.packageName, this.contractNameUpdated, migrateData).send({ from: appOwner }))
    });

    it('fails to upgrade from another account', async function () {
      await assertRevert(this.app.methods.upgradeAndCall(this.proxyAddress, this.packageName, this.contractNameUpdated, migrateData).send({ from: anotherAccount }))
    });

    it('fails to upgrade with incorrect migrate data', async function () {
      await assertRevert(this.app.methods.upgradeAndCall(this.proxyAddress, this.packageName, this.contractNameUpdated, incorrectData).send({ from: appOwner }))
    });
  })

  describe('getImplementation', function () {
    it('fetches the requested implementation from the directory', async function () {
      const implementation = await this.app.methods.getImplementation(this.packageName, this.contractName).call()
      implementation.should.be.equal(this.implementation_v0)
    })

    it('returns zero if implementation does not exist', async function () {
      const implementation = await this.app.methods.getImplementation(this.packageName, "NOTEXISTS").call()
      implementation.should.be.zeroAddress
    })

    it('returns zero if package name does not exist', async function () {
      const implementation = await this.app.methods.getImplementation("NOTEXISTS", this.contractName).call()
      implementation.should.be.zeroAddress
    })
  })

  describe('changeAdmin', function () {
    beforeEach("creating proxy", async function () {
      const { events } = await this.app.methods.create(this.packageName, this.contractName, EMPTY_INITIALIZATION_DATA).send()
      this.proxyAddress = events['ProxyCreated'].returnValues.proxy
    })

    it('changes admin of the proxy', async function () {
      await this.app.methods.changeProxyAdmin(this.proxyAddress, anotherAccount).send({ from: appOwner });
      const proxy = Proxy.at(this.proxyAddress);
      const admin = utils.toChecksumAddress(await proxy.admin());
      admin.should.be.equal(anotherAccount);
    });
  })
}
