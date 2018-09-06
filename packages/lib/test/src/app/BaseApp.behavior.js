'use strict';
require('../../setup')

import Contracts from '../../../src/utils/Contracts'
import Proxy from '../../../src/proxy/Proxy';
import FreezableImplementationDirectory from '../../../src/directory/FreezableImplementationDirectory';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

export default function shouldBehaveLikeApp(appClass, accounts, { setImplementation, setNewImplementation }) {
  const [_unused, owner, otherAdmin] = accounts;
  const txParams = { from: owner };
  const contractName = 'Impl';
  const packageName = 'MyPackage';

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
      this.app = await appClass.fetch(address, txParams)
    })

    shouldInitialize()
  })

  describe('createContract', function () {
    beforeEach('setting implementation', setImplementation);

    const shouldReturnANonUpgradeableInstance = function () {
      it('should return a non-upgradeable instance', async function () {
        this.instance.address.should.be.not.null;
        (await this.instance.version()).should.be.eq('V1');
        (await web3.eth.getCode(this.instance.address)).should.be.eq(ImplV1.deployedBytecode)
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
        this.instance = await this.app.createContract(ImplV1, packageName, contractName, 'initialize', [10]);
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
      provider.should.be.instanceof(FreezableImplementationDirectory)
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
        this.proxy = await this.app.createProxy(ImplV1, packageName, contractName, 'initialize', [10]);
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

  async function createProxy () {
    this.proxy = await this.app.createProxy(ImplV1, packageName, contractName);
  };  
};
