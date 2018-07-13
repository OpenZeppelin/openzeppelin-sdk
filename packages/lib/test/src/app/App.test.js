'use strict';
require('../../setup')

import App from '../../../src/app/App';
import Contracts from '../../../src/utils/Contracts'
import Proxy from '../../../src/utils/Proxy';

const AppDirectory = Contracts.getFromLocal('AppDirectory');
const Impl = Contracts.getFromLocal('Impl');
const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

contract('App', function ([_, owner, otherAdmin]) {
  const txParams = { from: owner }
  const initialVersion = '1.0';
  const contractName = 'Impl';
  const stdlibAddress = '0x0000000000000000000000000000000000000010';

  const shouldInitialize = function () {
    it('deploys all contracts', async function() {
      this.app.address().should.not.be.null;
      this.app.factory.address.should.not.be.null;
      this.app.package.address.should.not.be.null;
    });

    it('sets initial version', async function () {
      this.app.version.should.eq(initialVersion);
    });

    it('registers initial version in package', async function () {
      (await this.app.package.hasVersion(initialVersion)).should.be.true;
    });

    it('initializes all app properties', async function () {
      this.app.version.should.eq(initialVersion);
      this.app.directories.should.have.key(initialVersion);
    });

    it('returns the current directory', async function () {
      this.app.currentDirectory().address.should.be.not.null;
    });
  };

  const shouldConnectToStdlib = function () {
    it('should connect current directory to stdlib', async function () {
      const address = await this.app.package.getVersion(this.app.version);
      const currentDirectory = AppDirectory.at(address)
      const currentStdlib = await currentDirectory.stdlib()

      const stdlib = await this.app.currentStdlib();
      stdlib.should.be.eq(currentStdlib)
    });

    it('should tell whether current stdlib is zero', async function () {
      (await this.app.hasStdlib()).should.be.true
    })
  };

  describe('without stdlib', function () {
    beforeEach('deploying', async function () {
      this.app = await App.deploy(initialVersion, txParams)
    });

    describe('deploy', function () {
      shouldInitialize();

      it('should not have an stdlib initially', async function () {
        (await this.app.hasStdlib()).should.be.false
      })
    });

    describe('connect', function () {
      beforeEach('connecting to existing instance', async function () {
        this.app = await App.fetch(this.app.address(), txParams);
      });

      shouldInitialize();

      it('should not have an stdlib initially', async function () {
        (await this.app.hasStdlib()).should.be.false
      })
    });

    const newVersion = '2.0';
    const createVersion = async function () {
      await this.app.newVersion(newVersion);
    };

    describe('newVersion', function () {
      beforeEach('creating a new version', createVersion);

      it('updates own properties', async function () {
        this.app.version.should.eq(newVersion);
        this.app.directories.should.include.key(newVersion);
      });

      it('registers new version on package', async function () {
        (await this.app.package.hasVersion(newVersion)).should.be.true;
      });

      it('returns the current directory', async function () {
        const currentDirectory = await this.app.package.getVersion(newVersion);
        this.app.currentDirectory().address.should.eq(currentDirectory);
      });
    });

    const setImplementation = async function () {
      this.implementation_v1 = await this.app.setImplementation(ImplV1, contractName);
    };

    describe('setImplementation', function () {
      beforeEach('setting implementation', setImplementation);

      it('should return implementation', async function () {
        this.implementation_v1.address.should.be.not.null;
      });

      it('should register implementation on directory', async function () {
        const implementation = await this.app.currentDirectory().getImplementation(contractName);
        implementation.should.eq(this.implementation_v1.address);
      });
    });

    describe('unsetImplementation', function () {
      beforeEach('setting implementation', setImplementation)

      it('should unset implementation on directory', async function () {
        await this.app.unsetImplementation(contractName)
        const implementation = await this.app.currentDirectory().getImplementation(contractName)
        implementation.should.be.zeroAddress
      })
    })

    const createProxy = async function () {
      this.proxy = await this.app.createProxy(ImplV1, contractName);
    };

    describe('createProxy', function () {
      beforeEach('setting implementation', setImplementation);

      const shouldReturnProxy = function () {
        it('should return a proxy', async function () {
          this.proxy.address.should.be.not.null;
          (await this.proxy.version()).should.be.eq('V1');
          (await this.app.getProxyImplementation(this.proxy.address)).should.be.eq(this.implementation_v1.address)
        });
      };

      describe('without initializer', function () {
        beforeEach('creating a proxy', createProxy);
        shouldReturnProxy();
      });

      describe('with initializer', function () {
        beforeEach('creating a proxy', async function () {
          this.proxy = await this.app.createProxy(ImplV1, contractName, 'initialize', [10]);
        });

        shouldReturnProxy();

        it('should have initialized the proxy', async function () {
          (await this.proxy.value()).toNumber().should.eq(10);
        });
      });

      describe('with complex initializer', function () {
        beforeEach('creating a proxy', async function () {
          this.proxy = await this.app.createProxy(ImplV1, contractName, 'initialize', [10, "foo", []]);
        });

        shouldReturnProxy();

        it('should have initialized the proxy', async function () {
          (await this.proxy.value()).toNumber().should.eq(10);
          (await this.proxy.text()).should.eq("foo");
          await this.proxy.values(0).should.be.rejected;
        });
      });

      describe('with implicit contract name', async function () {
        beforeEach('creating a proxy', async function () {
          this.proxy = await this.app.createProxy(Impl);
        });
        shouldReturnProxy();
      });
    });

    describe('upgradeProxy', function () {
      beforeEach('setting implementation', setImplementation);
      beforeEach('create proxy', createProxy);
      beforeEach('creating new version', createVersion);
      beforeEach('setting new implementation', async function () {
        this.implementation_v2 = await this.app.setImplementation(ImplV2, contractName);
      });

      const shouldUpgradeProxy = function () {
        it('should upgrade proxy to ImplV2', async function () {
          (await this.proxy.version()).should.be.eq('V2');
          (await this.app.getProxyImplementation(this.proxy.address)).should.be.eq(this.implementation_v2.address)
        });
      };

      describe('without call', function () {
        beforeEach('upgrading the proxy', async function () {
          await this.app.upgradeProxy(this.proxy.address, ImplV2, contractName);
        });

        shouldUpgradeProxy();
      });

      describe('with call', function () {
        beforeEach('upgrading the proxy', async function () {
          await this.app.upgradeProxy(this.proxy.address, ImplV2, contractName, 'migrate', [20]);
        });

        shouldUpgradeProxy();

        it('should run migration', async function () {
          (await this.proxy.value()).toNumber().should.eq(20);
        });
      });

      describe('with implicit contract name', async function () {
        beforeEach('upgrading the proxy', async function () {
          await this.app.upgradeProxy(this.proxy.address, Impl);
        });

        shouldUpgradeProxy();
      });
    });

    describe('setStdlib', function () {
      beforeEach('setting stdlib from name', async function () {
        await this.app.setStdlib(stdlibAddress);
      });

      shouldConnectToStdlib();
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

  describe('with stdlib', function () {
    beforeEach('deploying', async function () {
      this.app = await App.deployWithStdlib(initialVersion, stdlibAddress, txParams);
    });

    describe('deploy', function () {
      shouldInitialize();
      shouldConnectToStdlib();
    });

    describe('connect', function () {
      beforeEach('connecting to existing instance', async function () {
        this.app = await App.fetch(this.app.address(), txParams);
      });

      shouldInitialize();
      shouldConnectToStdlib();
    });
  });
});
