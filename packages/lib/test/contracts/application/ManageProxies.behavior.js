'use strict';

import Proxy from '../../../src/proxy/Proxy';
import ZWeb3 from '../../../src/artifacts/ZWeb3';
import encodeCall from '../../../src/helpers/encodeCall';
import assertRevert from '../../../src/test/helpers/assertRevert';
import Contracts from '../../../src/artifacts/Contracts';
import utils from 'web3-utils';

const ProxyAdmin = Contracts.getFromLocal('ProxyAdmin');
const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2');

export default function shouldManageProxies([
  _,
  appOwner,
  directoryOwner,
  anotherAccount,
]) {
  const EMPTY_INITIALIZATION_DATA = Buffer.from('');
  const proxyAdminOwner = appOwner;

  const shouldCreateProxy = function() {
    it('sets proxy implementation', async function() {
      const implementation = await this.proxyAdmin.methods
        .getProxyImplementation(this.proxyAddress)
        .call();
      implementation.should.be.equal(this.implementation_v0);
    });

    it('sets proxy admin', async function() {
      const admin = await this.proxyAdmin.methods
        .getProxyAdmin(this.proxyAddress)
        .call();
      admin.should.be.equal(this.proxyAdmin.address);
    });

    it('delegates to implementation', async function() {
      const version = await DummyImplementation.at(this.proxyAddress)
        .methods.version()
        .call();
      version.should.be.equal('V1');
    });
  };

  const shouldUpgradeProxy = function() {
    it('upgrades to the requested implementation', async function() {
      const implementation = await this.proxyAdmin.methods
        .getProxyImplementation(this.proxyAddress)
        .call();
      implementation.should.be.equal(this.implementation_v1);
    });

    it('delegates to new implementation', async function() {
      const version = await DummyImplementationV2.at(this.proxyAddress)
        .methods.version()
        .call();
      version.should.be.equal('V2');
    });
  };

  describe('with proxy admin', function() {
    beforeEach('initialize proxy admin', async function() {
      this.proxyAdmin = await ProxyAdmin.new({ from: proxyAdminOwner });
      this.proxyAdminAddress = this.proxyAdmin.address;
    });

    describe('create', function() {
      describe('successful', function() {
        beforeEach('creating proxy', async function() {
          const { events } = await this.app.methods
            .create(
              this.packageName,
              this.contractName,
              this.proxyAdmin.address,
              EMPTY_INITIALIZATION_DATA,
            )
            .send({ from: proxyAdminOwner });
          this.proxyAddress = events['ProxyCreated'].returnValues.proxy;
        });

        shouldCreateProxy();
      });

      it('fails to create a proxy for unregistered package', async function() {
        await assertRevert(
          this.app.methods
            .create(
              'NOTEXISTS',
              this.contractName,
              this.proxyAdmin.address,
              EMPTY_INITIALIZATION_DATA,
            )
            .send(),
        );
      });

      it('fails to create a proxy for unregistered contract', async function() {
        await assertRevert(
          this.app.methods
            .create(
              this.packageName,
              'NOTEXISTS',
              this.proxyAdmin.address,
              EMPTY_INITIALIZATION_DATA,
            )
            .send(),
        );
      });
    });

    describe('createAndCall', function() {
      const value = 1e5;
      const initializeData = encodeCall('initializePayable', ['uint256'], [42]);
      const incorrectData = encodeCall('wrong', ['uint256'], [42]);

      describe('successful', function() {
        beforeEach('creating proxy', async function() {
          const { events } = await this.app.methods
            .create(
              this.packageName,
              this.contractName,
              this.proxyAdmin.address,
              initializeData,
            )
            .send({ value });
          this.proxyAddress = events['ProxyCreated'].returnValues.proxy;
        });

        shouldCreateProxy();

        it('initializes the proxy', async function() {
          const value = await DummyImplementation.at(this.proxyAddress)
            .methods.value()
            .call();
          value.should.eq('42');
        });

        it('sends given value to the proxy', async function() {
          const balance = await ZWeb3.getBalance(this.proxyAddress);
          balance.should.eq(value.toString());
        });
      });

      it('fails to create a proxy for unregistered package', async function() {
        await assertRevert(
          this.app.methods
            .create(
              'NOTEXISTS',
              this.contractName,
              this.proxyAdmin.address,
              initializeData,
            )
            .send({ value }),
        );
      });

      it('fails to create a proxy for unregistered contract', async function() {
        await assertRevert(
          this.app.methods
            .create(
              this.packageName,
              'NOTEXISTS',
              this.proxyAdmin.address,
              initializeData,
            )
            .send({ value }),
        );
      });

      it('fails to create a proxy with invalid initialize data', async function() {
        await assertRevert(
          this.app.methods
            .create(
              this.packageName,
              this.contractName,
              this.proxyAdmin.address,
              incorrectData,
            )
            .send({ value }),
        );
      });
    });

    describe('upgrade', function() {
      beforeEach('creating proxy', async function() {
        const { events } = await this.app.methods
          .create(
            this.packageName,
            this.contractName,
            this.proxyAdmin.address,
            EMPTY_INITIALIZATION_DATA,
          )
          .send({ from: appOwner });
        this.proxyAddress = events['ProxyCreated'].returnValues.proxy;
      });

      describe('successful', async function() {
        beforeEach('upgrading proxy', async function() {
          await this.proxyAdmin.methods
            .upgrade(this.proxyAddress, this.implementation_v1)
            .send({ from: proxyAdminOwner });
        });

        shouldUpgradeProxy();
      });
    });

    describe('upgradeAndCall', function() {
      const value = 1e5;
      const initializeData = encodeCall('initializePayable', ['uint256'], [42]);
      const migrateData = encodeCall('migrate', ['uint256'], [84]);
      const incorrectData = encodeCall('wrong', ['uint256'], [42]);

      beforeEach('creating proxy', async function() {
        const { events } = await this.app.methods
          .create(
            this.packageName,
            this.contractName,
            this.proxyAdmin.address,
            initializeData,
          )
          .send({ from: appOwner });
        this.proxyAddress = events['ProxyCreated'].returnValues.proxy;
      });

      describe('successful', async function() {
        beforeEach('upgrading proxy', async function() {
          await this.proxyAdmin.methods
            .upgradeAndCall(
              this.proxyAddress,
              this.implementation_v1,
              migrateData,
            )
            .send({ value, from: proxyAdminOwner });
        });

        shouldUpgradeProxy();

        it('migrates the proxy', async function() {
          const value = await DummyImplementationV2.at(this.proxyAddress)
            .methods.value()
            .call();
          value.should.eq('84');
        });

        it('sends given value to the proxy', async function() {
          const balance = await ZWeb3.getBalance(this.proxyAddress);
          balance.should.eq(value.toString());
        });
      });
    });

    describe('changeAdmin', function() {
      beforeEach('creating proxy', async function() {
        const { events } = await this.app.methods
          .create(
            this.packageName,
            this.contractName,
            this.proxyAdmin.address,
            EMPTY_INITIALIZATION_DATA,
          )
          .send();
        this.proxyAddress = events['ProxyCreated'].returnValues.proxy;
      });

      it('changes admin of the proxy', async function() {
        await this.proxyAdmin.methods
          .changeProxyAdmin(this.proxyAddress, anotherAccount)
          .send({ from: proxyAdminOwner });
        const proxy = Proxy.at(this.proxyAddress);
        const admin = utils.toChecksumAddress(await proxy.admin());
        admin.should.be.equal(anotherAccount);
      });
    });
  });

  describe('getImplementation', function() {
    it('fetches the requested implementation from the directory', async function() {
      const implementation = await this.app.methods
        .getImplementation(this.packageName, this.contractName)
        .call();
      implementation.should.be.equal(this.implementation_v0);
    });

    it('returns zero if implementation does not exist', async function() {
      const implementation = await this.app.methods
        .getImplementation(this.packageName, 'NOTEXISTS')
        .call();
      implementation.should.be.zeroAddress;
    });

    it('returns zero if package name does not exist', async function() {
      const implementation = await this.app.methods
        .getImplementation('NOTEXISTS', this.contractName)
        .call();
      implementation.should.be.zeroAddress;
    });
  });
}
