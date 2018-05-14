'use strict';

import AppDeployer from '../../src/app/AppDeployer';
import AppProvider from '../../src/app/AppProvider';

const ImplV1 = artifacts.require('DummyImplementation');
const ImplV2 = artifacts.require('DummyImplementationV2');

require('chai').should();

contract('App', function ([_, owner]) {
  const txParams = { from: owner }
  const initialVersion = '1.0';
  const contractName = 'Impl';
  const stdlibAddress = '0x0000000000000000000000000000000000000010';

  const shouldInitialize = function () {
    it('deploys all contracts', async function() {
      this.appWrapper.app.address.should.not.be.null;
      this.appWrapper.factory.address.should.not.be.null;
      this.appWrapper.package.address.should.not.be.null;
    });

    it('sets app at initial version', async function () {
      (await this.appWrapper.app.version()).should.eq(initialVersion);
    });

    it('registers initial version in package', async function () {
      (await this.appWrapper.package.hasVersion(initialVersion)).should.be.true;
    });

    it('initializes all app properties', async function () {
      this.appWrapper.version.should.eq(initialVersion);
      this.appWrapper.directories.should.have.key(initialVersion);
    });

    it('returns the current directory', async function () {
      this.appWrapper.currentDirectory().address.should.be.not.null;
    });
  };

  const shouldConnectToStdlib = function () {
    it('should connect current directory to stdlib', async function () {
      const directory = this.appWrapper.currentDirectory();
      (await directory.stdlib()).should.eq(stdlibAddress);
    });
  };

  describe('without stdlib', function () {
    beforeEach('deploying', async function () {
      this.appWrapper = await AppDeployer.call(initialVersion, txParams)
    });

    describe('deploy', function () {
      shouldInitialize();
    });

    describe('connect', function () {
      beforeEach('connecting to existing instance', async function () {
        const connectedApp = await AppProvider.from(this.appWrapper.app.address, txParams);
        this.appWrapper = connectedApp;
      });

      shouldInitialize();
    });

    const newVersion = '2.0';
    const createVersion = async function () {
      await this.appWrapper.newVersion(newVersion);
    };

    describe('newVersion', function () {
      beforeEach('creating a new version', createVersion);

      it('updates own properties', async function () {
        this.appWrapper.version.should.eq(newVersion);
        this.appWrapper.directories.should.include.key(newVersion);
      });

      it('updates app version', async function () {
        (await this.appWrapper.app.version()).should.eq(newVersion);
      });

      it('registers new version on package', async function () {
        (await this.appWrapper.package.hasVersion(newVersion)).should.be.true;
      });

      it('returns the current directory', async function () {
        const currentDirectory = await this.appWrapper.package.getVersion(newVersion);
        this.appWrapper.currentDirectory().address.should.eq(currentDirectory);
      });
    });

    const setImplementation = async function () {
      this.implementation = await this.appWrapper.setImplementation(ImplV1, contractName);
    };

    describe('setImplementation', function () {
      beforeEach('setting implementation', setImplementation);

      it('should return implementation', async function () {
        this.implementation.address.should.be.not.null;
      });

      it('should register implementation on directory', async function () {
        const implementation = await this.appWrapper.currentDirectory().getImplementation(contractName);
        implementation.should.eq(this.implementation.address);
      });
    });

    const createProxy = async function () {
      this.proxy = await this.appWrapper.createProxy(ImplV1, contractName);
    };

    describe('createProxy', function () {
      beforeEach('setting implementation', setImplementation);

      const shouldReturnProxy = function () {
        it('should return a proxy', async function () {
          this.proxy.address.should.be.not.null;
          (await this.proxy.version()).should.eq('V1');
        });
      };

      describe('without initializer', function () {
        beforeEach('creating a proxy', createProxy);
        shouldReturnProxy();
      });

      describe('with initializer', function () {
        beforeEach('creating a proxy', async function () {
          this.proxy = await this.appWrapper.createProxy(ImplV1, contractName, 'initialize', [10]);
        });

        shouldReturnProxy();

        it('should have initialized the proxy', async function () {
          (await this.proxy.value()).toNumber().should.eq(10);
        });
      });
    });
    
    describe('upgradeProxy', function () {
      beforeEach('setting implementation', setImplementation);
      beforeEach('create proxy', createProxy);
      beforeEach('creating new version', createVersion);
      beforeEach('setting new implementation', async function () {
        this.implementation = await this.appWrapper.setImplementation(ImplV2, contractName);
      });

      const shouldUpgradeProxy = function () {
        it('should upgrade proxy to ImplV2', async function () {
          (await this.proxy.version()).should.eq('V2');
        });
      };

      describe('without call', function () {
        beforeEach('upgrading the proxy', async function () {
          await this.appWrapper.upgradeProxy(this.proxy.address, ImplV2, contractName);
        });
        
        shouldUpgradeProxy();
      });

      describe('with call', function () {
        beforeEach('upgrading the proxy', async function () {
          await this.appWrapper.upgradeProxy(this.proxy.address, ImplV2, contractName, 'migrate', [20]);
        });
        
        shouldUpgradeProxy();
        
        it('should run migration', async function () {
          (await this.proxy.value()).toNumber().should.eq(20);
        });
      });
    });

    describe('setStdlib', function () {
      beforeEach('setting stdlib from name', async function () {
        await this.appWrapper.setStdlib(stdlibAddress);
      });

      shouldConnectToStdlib();
    });
  });

  describe('with stdlib', function () {
    beforeEach('deploying', async function () {
      this.appWrapper = await AppDeployer.withStdlib(initialVersion, stdlibAddress, txParams);
    });

    describe('deploy', function () {
      shouldInitialize();
      shouldConnectToStdlib();
    });

    describe('connect', function () {
      beforeEach('connecting to existing instance', async function () {
        const connectedApp = await AppProvider.from(this.appWrapper.app.address, txParams);
        this.appWrapper = connectedApp;
      });

      shouldInitialize();
      shouldConnectToStdlib();
    });
  });

  describe('with stdlib', function () {
    beforeEach('deploying', async function () {
      this.appWrapper = await AppDeployer.withStdlib(initialVersion, stdlibAddress, txParams);
    });

    describe('deploy', function () {
      shouldInitialize();
      shouldConnectToStdlib();
    });
  });
});
