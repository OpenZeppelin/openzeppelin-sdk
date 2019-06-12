'use strict';

require('../../setup');

import App from '../../../src/application/App';
import ZWeb3 from '../../../src/artifacts/ZWeb3';
import Package from '../../../src/application/Package';
import Contracts from '../../../src/artifacts/Contracts';
import ProxyAdmin from '../../../src/proxy/ProxyAdmin';
import { ZERO_ADDRESS } from '../../../src/utils/Addresses';
import { ImplementationDirectory, Proxy } from '../../../src';
import Transactions from '../../../src/utils/Transactions';
import utils from 'web3-utils';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');
const ProxyCreator = Contracts.getFromLocal('ProxyCreator');

contract('App', function(accounts) {
  accounts = accounts.map(utils.toChecksumAddress); // Required by Web3 v1.x.

  const [_unused, owner, otherAdmin] = accounts;
  const txParams = { from: owner };
  const contractName = 'Impl';
  const packageName = 'MyPackage';
  const anotherPackageName = 'AnotherPackage';
  const version = '1.0.0';
  const anotherVersion = '2.0.0';

  beforeEach('deploying', async function deploy() {
    this.app = await App.deploy(txParams);
  });

  async function setPackage() {
    this.package = await Package.deploy(txParams);
    this.directory = await this.package.newVersion(version);
    this.setPackageTx = await this.app.setPackage(
      packageName,
      this.package.address,
      version,
    );
  }

  describe('getPackage', function() {
    beforeEach('setting package', setPackage);

    it('returns package info', async function() {
      const packageInfo = await this.app.getPackage(packageName);
      packageInfo.package.address.should.eq(this.package.address);
      packageInfo.package.should.be.instanceof(Package);
      packageInfo.version.should.be.semverEqual(version);
    });

    it('returns empty info if not exists', async function() {
      const packageInfo = await this.app.getPackage('NOTEXISTS');
      (packageInfo.package === null).should.be.true;
    });
  });

  describe('hasPackage', function() {
    beforeEach('setting package', setPackage);

    it('returns true if exists', async function() {
      const hasPackage = await this.app.hasPackage(packageName, version);
      hasPackage.should.be.true;
    });

    it('returns false if not exists', async function() {
      const hasPackage = await this.app.hasPackage('NOTEXISTS', version);
      hasPackage.should.be.false;
    });
  });

  describe('setPackage', function() {
    it('logs package set', async function() {
      const thepackage = await Package.deploy(txParams);
      await thepackage.newVersion(version);

      const { events } = await this.app.setPackage(
        packageName,
        thepackage.address,
        version,
      );
      const event = events['PackageChanged'];
      expect(event).to.be.an('object');
      event.returnValues.providerName.should.be.equal(packageName);
      event.returnValues.package.should.be.equal(thepackage.address);
      event.returnValues.version.should.be.semverEqual(version);
    });

    it('can set multiple packages', async function() {
      const package1 = await Package.deploy(txParams);
      const package2 = await Package.deploy(txParams);

      const directory1 = await package1.newVersion(version);
      const directory2 = await package2.newVersion(anotherVersion);

      await this.app.setPackage(packageName, package1.address, version);
      await this.app.setPackage(
        anotherPackageName,
        package2.address,
        anotherVersion,
      );

      const provider1 = await this.app.getProvider(packageName);
      provider1.address.should.eq(directory1.address);

      const provider2 = await this.app.getProvider(anotherPackageName);
      provider2.address.should.eq(directory2.address);
    });

    it('can overwrite package version', async function() {
      await setPackage.apply(this);
      await this.package.newVersion(anotherVersion);
      await this.app.setPackage(
        packageName,
        this.package.address,
        anotherVersion,
      );
      const packageInfo = await this.app.getPackage(packageName);
      packageInfo.version.should.be.semverEqual(anotherVersion);
    });
  });

  describe('unsetPackage', function() {
    beforeEach('setting package', setPackage);

    it('unsets a provider', async function() {
      const { events } = await this.app.unsetPackage(packageName);
      const event = events['PackageChanged'];
      expect(event).to.be.an('object');
      event.returnValues.providerName.should.be.equal(packageName);
      event.returnValues.package.should.be.equal(ZERO_ADDRESS);
      event.returnValues.version.should.be.semverEqual('0.0.0');
      const hasProvider = await this.app.hasProvider(packageName);
      hasProvider.should.be.false;
    });
  });

  function shouldInitialize() {
    it('initializes the app', async function() {
      this.app.contract.should.be.not.null;
      this.app.address.should.be.nonzeroAddress;
    });
  }

  describe('deploy', function() {
    shouldInitialize();
  });

  describe('fetch', function() {
    beforeEach('fetching', async function() {
      const address = this.app.address;
      this.app = await App.fetch(address, txParams);
    });

    shouldInitialize();
  });

  async function setImplementation() {
    this.package = await Package.deploy(txParams);
    this.directory = await this.package.newVersion(version);
    this.implV1 = await Transactions.deployContract(ImplV1);
    await this.directory.setImplementation(contractName, this.implV1.address);
    await this.app.setPackage(packageName, this.package.address, version);
  }

  async function setNewImplementation() {
    this.directory = await this.package.newVersion(anotherVersion);
    this.implV2 = await Transactions.deployContract(ImplV2);
    await this.directory.setImplementation(contractName, this.implV2.address);
    await this.app.setPackage(
      packageName,
      this.package.address,
      anotherVersion,
    );
  }

  describe('getImplementation', async function() {
    beforeEach('setting implementation', setImplementation);

    it('returns implementation address', async function() {
      const implementation = await this.app.getImplementation(
        packageName,
        contractName,
      );
      implementation.should.eq(this.implV1.address);
    });

    it('returns zero if not exists', async function() {
      const implementation = await this.app.getImplementation(
        packageName,
        'NOTEXISTS',
      );
      implementation.should.be.zeroAddress;
    });
  });

  describe('getProvider', async function() {
    beforeEach('setting implementation', setImplementation);

    it('returns provider', async function() {
      const provider = await this.app.getProvider(packageName);
      provider.address.should.eq(this.directory.address);
      provider.should.be.instanceof(ImplementationDirectory);
    });

    it('returns null if not exists', async function() {
      const provider = await this.app.getProvider('NOTEXISTS');
      const isNull = provider === null;
      isNull.should.be.true;
    });
  });

  describe('hasProvider', async function() {
    beforeEach('setting implementation', setImplementation);

    it('returns true', async function() {
      const hasProvider = await this.app.hasProvider(packageName);
      hasProvider.should.be.true;
    });

    it('returns false if not exists', async function() {
      const hasProvider = await this.app.hasProvider('NOTEXISTS');
      hasProvider.should.be.false;
    });
  });

  function createProxy(impl, packageName, contractName, initMethod, initArgs) {
    return async function() {
      this.proxyAdmin = await ProxyAdmin.deploy(txParams);
      this.proxy = initArgs
        ? await this.app.createProxy(
            impl,
            packageName,
            contractName,
            this.proxyAdmin.address,
            initMethod,
            initArgs,
          )
        : await this.app.createProxy(
            impl,
            packageName,
            contractName,
            this.proxyAdmin.address,
          );
    };
  }

  describe('createProxy', function() {
    beforeEach('setting implementation', setImplementation);

    const shouldReturnProxy = function() {
      it('should return a proxy', async function() {
        this.proxy.address.should.be.not.null;
        (await this.proxy.methods.version().call()).should.be.eq('V1');
        (await this.proxyAdmin.getProxyImplementation(
          this.proxy.address,
        )).should.be.eq(this.implV1.address);
      });
    };

    describe('without initializer', function() {
      beforeEach(
        'creating a proxy',
        createProxy(ImplV1, packageName, contractName),
      );
      shouldReturnProxy();
    });

    describe('with initializer', function() {
      beforeEach(
        'creating a proxy',
        createProxy(ImplV1, packageName, contractName, 'initializeNonPayable', [
          10,
        ]),
      );
      shouldReturnProxy();

      it('should have initialized the proxy', async function() {
        const value = await this.proxy.methods.value().call();
        value.should.eq('10');
      });
    });

    describe('with complex initializer', function() {
      beforeEach(
        'creating a proxy',
        createProxy(ImplV1, packageName, contractName, 'initialize', [
          10,
          'foo',
          [],
        ]),
      );
      shouldReturnProxy();

      it('should have initialized the proxy', async function() {
        const value = await this.proxy.methods.value().call();
        value.should.eq('10');
        const text = await this.proxy.methods.text().call();
        text.should.eq('foo');
        this.proxy.methods.values(0).call().should.be.rejected;
      });
    });

    describe('with initializer that spawns additional proxies', function() {
      beforeEach('setting proxy creator implementation', async function() {
        this.proxyCreator = await Transactions.deployContract(ProxyCreator);
        await this.directory.setImplementation(
          'ProxyCreator',
          this.proxyCreator.address,
        );
      });

      it('should return proxy creator instance', async function() {
        this.proxyAdmin = await ProxyAdmin.deploy(txParams);
        const fnArgs = [
          this.app.address,
          packageName,
          contractName,
          this.proxyAdmin.address,
          Buffer.from(''),
        ];
        const proxy = await this.app.createProxy(
          ProxyCreator,
          packageName,
          'ProxyCreator',
          this.proxyAdmin.address,
          'initialize',
          fnArgs,
        );
        (await proxy.methods.name().call()).should.eq('ProxyCreator');
        const created = await proxy.methods.created().call();
        (await ImplV1.at(created)
          .methods.version()
          .call()).should.eq('V1');
      });
    });
  });
});
