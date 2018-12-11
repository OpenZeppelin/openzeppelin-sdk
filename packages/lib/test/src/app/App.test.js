'use strict';

require('../../setup')

import App from '../../../src/app/App';
import ZWeb3 from '../../../src/artifacts/ZWeb3'
import Package from '../../../src/package/Package'
import Contracts from '../../../src/utils/Contracts'
import expectEvent from 'openzeppelin-solidity/test/helpers/expectEvent'
import { ZERO_ADDRESS } from '../../../src/utils/Addresses';
import { ImplementationDirectory, Proxy } from '../../../src';
import { deploy as deployContract } from '../../../src/utils/Transactions';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');
const ProxyCreator = Contracts.getFromLocal('ProxyCreator');

contract('App', function (accounts) {
  const [_unused, owner, otherAdmin] = accounts;
  const txParams = { from: owner };
  const contractName = 'Impl';
  const packageName = 'MyPackage';
  const anotherPackageName = 'AnotherPackage';
  const version = '1.0.0';
  const anotherVersion = '2.0.0';

  beforeEach('deploying', async function deploy () {
    this.app = await App.deploy(txParams)
  })

  async function setPackage() {
    this.package = await Package.deploy(txParams)
    this.directory = await this.package.newVersion(version)
    this.setPackageTx = await this.app.setPackage(packageName, this.package.address, version)
  }

  describe('getPackage', function () {
    beforeEach('setting package', setPackage)

    it('returns package info', async function () {
      const packageInfo = await this.app.getPackage(packageName);
      packageInfo.package.address.should.eq(this.package.address)
      packageInfo.package.should.be.instanceof(Package)
      packageInfo.version.should.be.semverEqual(version)
    })

    it('returns empty info if not exists', async function () {
      const packageInfo = await this.app.getPackage('NOTEXISTS');
      (packageInfo.package === null).should.be.true
    })
  })

  describe('hasPackage', function () {
    beforeEach('setting package', setPackage)

    it('returns true if exists', async function () {
      const hasPackage = await this.app.hasPackage(packageName, version)
      hasPackage.should.be.true
    })

    it('returns false if not exists', async function () {
      const hasPackage = await this.app.hasPackage('NOTEXISTS', version)
      hasPackage.should.be.false
    })
  })

  describe('setPackage', function () {
    it('logs package set', async function () {
      const thepackage = await Package.deploy(txParams)
      await thepackage.newVersion(version)
      await expectEvent.inTransaction(
        this.app.setPackage(packageName, thepackage.address, version),
        'PackageChanged',
        { providerName: packageName, package: thepackage.address, version: version }
      )
    })

    it('can set multiple packages', async function () {
      const package1 = await Package.deploy(txParams)
      const package2 = await Package.deploy(txParams)

      const directory1 = await package1.newVersion(version)
      const directory2 = await package2.newVersion(anotherVersion)

      await this.app.setPackage(packageName, package1.address, version);
      await this.app.setPackage(anotherPackageName, package2.address, anotherVersion);
      
      const provider1 = await this.app.getProvider(packageName);
      provider1.address.should.eq(directory1.address);

      const provider2 = await this.app.getProvider(anotherPackageName);
      provider2.address.should.eq(directory2.address);
    })

    it('can overwrite package version', async function () {
      await setPackage.apply(this)
      await this.package.newVersion(anotherVersion)
      await this.app.setPackage(packageName, this.package.address, anotherVersion)
      const packageInfo = await this.app.getPackage(packageName)
      packageInfo.version.should.be.semverEqual(anotherVersion)
    })
  })

  describe('unsetPackage', function () {
    beforeEach('setting package', setPackage)

    it('unsets a provider', async function () {
      await expectEvent.inTransaction(
        this.app.unsetPackage(packageName),
        'PackageChanged',
        { providerName: packageName, package: ZERO_ADDRESS, version: "" } 
      )
      const hasProvider = await this.app.hasProvider(packageName)
      hasProvider.should.be.false
    })
  })

  function shouldInitialize () {
    it('initializes the app', async function () {
      this.app.contract.should.be.not.null
      this.app.address.should.be.nonzeroAddress
    })
  }

  describe('deploy', function () {
    shouldInitialize()
  })

  describe('fetch', function () {
    beforeEach('fetching', async function () {
      const address = this.app.address
      this.app = await App.fetch(address, txParams)
    })

    shouldInitialize()
  })

  async function setImplementation () {
    this.package = await Package.deploy(txParams)
    this.directory = await this.package.newVersion(version)
    this.implV1 = await deployContract(ImplV1)
    await this.directory.setImplementation(contractName, this.implV1.address)
    await this.app.setPackage(packageName, this.package.address, version)
  }

  async function setNewImplementation () {
    this.directory = await this.package.newVersion(anotherVersion)
    this.implV2 = await deployContract(ImplV2)
    await this.directory.setImplementation(contractName, this.implV2.address)
    await this.app.setPackage(packageName, this.package.address, anotherVersion)
  }

  describe('createContract', function () {
    beforeEach('setting implementation', setImplementation);

    const shouldReturnANonUpgradeableInstance = function () {
      it('should return a non-upgradeable instance', async function () {
        this.instance.address.should.be.not.null;
        (await this.instance.version()).should.be.eq('V1');
        (await ZWeb3.getCode(this.instance.address)).should.be.eq(ImplV1.deployedBytecode)
      });
    };

    describe('without initializer', function () {
      beforeEach('creating a non-upgradeable instance', async function () {
        this.instance = await this.app.createContract(ImplV1, packageName, contractName);
      });

      shouldReturnANonUpgradeableInstance();
    });

    describe('with initializer', function () {
      beforeEach('creating a non-upgradeable instance', async function () {
        this.instance = await this.app.createContract(ImplV1, packageName, contractName, 'initializeNonPayable', [10]);
      });

      shouldReturnANonUpgradeableInstance();

      it('should have initialized the instance', async function () {
        (await this.instance.value()).toNumber().should.eq(10);
      });
    });

    describe('with complex initializer', function () {
      beforeEach('creating a non-upgradeable instance', async function () {
        this.instance = await this.app.createContract(ImplV1, packageName, contractName, 'initialize', [10, "foo", []]);
      });

      shouldReturnANonUpgradeableInstance();

      it('should have initialized the proxy', async function () {
        (await this.instance.value()).toNumber().should.eq(10);
        (await this.instance.text()).should.eq("foo");
        await this.instance.values(0).should.be.rejected;
      });
    });
  });

  describe('getImplementation', async function () {
    beforeEach('setting implementation', setImplementation);

    it('returns implementation address', async function () {
      const implementation = await this.app.getImplementation(packageName, contractName)
      implementation.should.eq(this.implV1.address)
    })

    it('returns zero if not exists', async function () {
      const implementation = await this.app.getImplementation(packageName, 'NOTEXISTS')
      implementation.should.be.zeroAddress
    })
  })

  describe('getProvider', async function () {
    beforeEach('setting implementation', setImplementation);

    it('returns provider', async function () {
      const provider = await this.app.getProvider(packageName)
      provider.address.should.eq(this.directory.address)
      provider.should.be.instanceof(ImplementationDirectory)
    })

    it('returns null if not exists', async function () {
      const provider = await this.app.getProvider('NOTEXISTS')
      const isNull = (provider === null)
      isNull.should.be.true
    })
  })

  describe('hasProvider', async function () {
    beforeEach('setting implementation', setImplementation);

    it('returns true', async function () {
      const hasProvider = await this.app.hasProvider(packageName)
      hasProvider.should.be.true
    })

    it('returns false if not exists', async function () {
      const hasProvider = await this.app.hasProvider('NOTEXISTS')
      hasProvider.should.be.false
    })
  })

  async function createProxy () {
    this.proxy = await this.app.createProxy(ImplV1, packageName, contractName);
  };

  describe('createProxy', function () {
    beforeEach('setting implementation', setImplementation);

    const shouldReturnProxy = function () {
      it('should return a proxy', async function () {
        this.proxy.address.should.be.not.null;
        (await this.proxy.version()).should.be.eq('V1');
        (await this.app.getProxyImplementation(this.proxy.address)).should.be.eq(this.implV1.address)
      });
    };

    describe('without initializer', function () {
      beforeEach('creating a proxy', createProxy);
      shouldReturnProxy();
    });

    describe('with initializer', function () {
      beforeEach('creating a proxy', async function () {
        this.proxy = await this.app.createProxy(ImplV1, packageName, contractName, 'initializeNonPayable', [10]);
      });

      shouldReturnProxy();

      it('should have initialized the proxy', async function () {
        (await this.proxy.value()).toNumber().should.eq(10);
      });
    });

    describe('with complex initializer', function () {
      beforeEach('creating a proxy', async function () {
        this.proxy = await this.app.createProxy(ImplV1, packageName, contractName, 'initialize', [10, "foo", []]);
      });

      shouldReturnProxy();

      it('should have initialized the proxy', async function () {
        (await this.proxy.value()).toNumber().should.eq(10);
        (await this.proxy.text()).should.eq("foo");
        await this.proxy.values(0).should.be.rejected;
      });
    });

    describe('with initializer that spawns additional proxies', function () {
      beforeEach('setting proxy creator implementation', async function () {
        this.proxyCreator = await deployContract(ProxyCreator);
        await this.directory.setImplementation('ProxyCreator', this.proxyCreator.address);
      });

      it('should return proxy creator instance', async function () {
        const proxy = await this.app.createProxy(ProxyCreator, packageName, 'ProxyCreator', 'initialize', [this.app.address, packageName, contractName, '']);
        (await proxy.name()).should.eq('ProxyCreator');
        const created = await proxy.created();
        (await ImplV1.at(created).version()).should.eq('V1');
      });
    });
  });

  describe('upgradeProxy', function () {
    beforeEach('setting implementation', setImplementation);
    beforeEach('create proxy', createProxy);
    beforeEach('setting new implementation', setNewImplementation)

    const shouldUpgradeProxy = function () {
      it('should upgrade proxy to ImplV2', async function () {
        (await this.proxy.version()).should.be.eq('V2');
        (await this.app.getProxyImplementation(this.proxy.address)).should.be.eq(this.implV2.address)
      });
    };

    describe('without call', function () {
      beforeEach('upgrading the proxy', async function () {
        await this.app.upgradeProxy(this.proxy.address, ImplV2, packageName, contractName);
      });

      shouldUpgradeProxy();
    });

    describe('with call', function () {
      beforeEach('upgrading the proxy', async function () {
        await this.app.upgradeProxy(this.proxy.address, ImplV2, packageName, contractName, 'migrate', [20]);
      });

      shouldUpgradeProxy();

      it('should run migration', async function () {
        (await this.proxy.value()).toNumber().should.eq(20);
      });
    });
  });

  describe('changeProxyAdmin', function () {
    beforeEach('setting implementation', setImplementation);
    beforeEach('create proxy', createProxy);

    it('should change proxy admin', async function () {
      await this.app.changeProxyAdmin(this.proxy.address, otherAdmin);
      const proxyWrapper = Proxy.at(this.proxy.address);
      const actualAdmin = await proxyWrapper.admin();
      actualAdmin.should.be.eq(otherAdmin);
    });
  });  
});
