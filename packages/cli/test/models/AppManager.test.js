import AppManager from '../../src/models/AppManager';
import Stdlib from '../../src/models/Stdlib';

const ImplV1 = artifacts.require('ImplV1');
const ImplV2 = artifacts.require('ImplV2');

const should = require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('AppManager', function ([_, owner]) {
  const initialVersion = "1.0";
  const contractName = 'Impl';
  const networkName = 'test';
  const stdlibAddress = "0x0000000000000000000000000000000000000010";
  const stdlibName = 'mock-stdlib';

  const shouldInitialize = function () {
    it('deploys all contracts', async function() {
      this.app.appManager.address.should.not.be.null;
      this.app.factory.address.should.not.be.null;
      this.app.package.address.should.not.be.null;
    });

    it('sets app manager at initial version', async function () {
      (await this.app.appManager.version()).should.eq(initialVersion);
    });

    it('registers initial version in package', async function () {
      (await this.app.package.hasVersion(initialVersion)).should.be.true;
    });

    it('initializes all app properties', async function () {
      this.app.version.should.eq(initialVersion);
      this.app.directories.should.have.key(initialVersion);
    });

    it('returns the current directory', async function () {
      this.app.getCurrentDirectory().address.should.be.not.null;
    });
  };

  const shouldConnectToStdlib = function () {
    it('should connect current directory to stdlib', async function () {
      const directory = await this.app.getCurrentDirectory();
      (await directory.stdlib()).should.eq(stdlibAddress);
    });
  };

  describe('without stdlib', function () {

    beforeEach("deploying", async function () {
      this.app = new AppManager(owner, networkName);
      await this.app.deploy(initialVersion);
    });

    describe('deploy', function () {
      shouldInitialize();
    });

    describe('connect', function () {
      beforeEach("connecting to existing instance", async function () {
        const connectedApp = new AppManager(owner);
        await connectedApp.connect(this.app.appManager.address);
        this.app = connectedApp;
      });

      shouldInitialize();
    });

    const newVersion = "2.0";
    const createVersion = async function () {
      await this.app.newVersion(newVersion);
    };

    describe('newVersion', function () {
      beforeEach('creating a new version', createVersion);

      it('updates own properties', async function () {
        this.app.version.should.eq(newVersion);
        this.app.directories.should.include.key(newVersion);
      });

      it('updates app manager version', async function () {
        (await this.app.appManager.version()).should.eq(newVersion);
      });

      it('registers new version on package', async function () {
        (await this.app.package.hasVersion(newVersion)).should.be.true;
      });

      it('returns the current directory', async function () {
        const currentDirectory = await this.app.package.getVersion(newVersion);
        this.app.getCurrentDirectory().address.should.eq(currentDirectory);
      });
    });

    const setImplementation = async function () {
      this.implementation = await this.app.setImplementation(ImplV1, contractName);
    };

    describe('setImplementation', function () {
      beforeEach('setting implementation', setImplementation);

      it('should return implementation', async function () {
        this.implementation.address.should.be.not.null;
      });

      it('should register implementation on directory', async function () {
        const implementation = await this.app.getCurrentDirectory().getImplementation(contractName);
        implementation.should.eq(this.implementation.address);
      });
    });

    const createProxy = async function () {
      this.proxy = await this.app.createProxy(ImplV1, contractName);
    };

    describe('createProxy', function () {
      beforeEach('setting implementation', setImplementation);

      const shouldReturnProxy = function () {
        it('should return a proxy', async function () {
          this.proxy.address.should.be.not.null;
          (await this.proxy.say()).should.eq("V1");
        });
      };

      describe('without initializer', function () {
        beforeEach("creating a proxy", createProxy);
        shouldReturnProxy();
      });

      describe('with initializer', function () {
        beforeEach("creating a proxy", async function () {
          this.proxy = await this.app.createProxy(ImplV1, contractName, 'initialize', [10]);
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
        this.implementation = await this.app.setImplementation(ImplV2, contractName);
      });

      const shouldUpgradeProxy = function () {
        it('should upgrade proxy to ImplV2', async function () {
          (await this.proxy.say()).should.eq("V2");
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
    });

    describe('setStdlib', function () {
      describe('from name', function () {
        beforeEach("setting stdlib from name", async function () {
          await this.app.setStdlib(stdlibName);
        });

        shouldConnectToStdlib();
      });

      describe('from object', function () {
        beforeEach("setting stdlib from object", async function () {
          this.stdlib = new Stdlib(stdlibName);
          await this.app.setStdlib(this.stdlib);
        });

        shouldConnectToStdlib();
      });
    });
  });

  describe('with stdlib', function () {
    beforeEach("deploying", async function () {
      this.stdlib = new Stdlib(stdlibName, owner);
      this.app = new AppManager(owner, networkName);
      await this.app.deploy(initialVersion, this.stdlib);
    });

    describe('deploy', function () {
      shouldInitialize();
      shouldConnectToStdlib();
    });

    describe('connect', function () {
      beforeEach("connecting to existing instance", async function () {
        const connectedApp = new AppManager(owner);
        await connectedApp.connect(this.app.appManager.address);
        this.app = connectedApp;
      });

      shouldInitialize();
      shouldConnectToStdlib();
    });
  });

  describe('with stdlib via name', function () {
    beforeEach("deploying", async function () {
      this.app = new AppManager(owner, networkName);
      await this.app.deploy(initialVersion, stdlibName);
    });

    describe('deploy', function () {
      shouldInitialize();
      shouldConnectToStdlib();
    });
  });
 });
