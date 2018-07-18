'use strict'
require('../setup')

import add from '../../src/scripts/add.js';
import push from '../../src/scripts/push.js';
import bumpVersion from '../../src/scripts/bump.js';
import createProxy from '../../src/scripts/create.js';
import status from '../../src/scripts/status.js';
import linkStdlib from '../../src/scripts/link';
import ControllerFor from '../../src/models/local/ControllerFor';
import CaptureLogs from '../helpers/captureLogs';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";
import remove from '../../src/scripts/remove';

contract('status script', function([_, owner]) {
  const txParams = { from: owner };
  const network = 'test';
  const contractName = 'ImplV1';
  const contractAlias = 'Impl';
  const contractsData = [{ name: contractName, alias: contractAlias }]
  const anotherContractName = 'AnotherImplV1';
  const stdlibNameVersion = 'mock-stdlib@1.1.0';
  
  beforeEach('setup', async function() {
    this.logs = new CaptureLogs();
  });

  afterEach('cleanup', function () {
    this.logs.restore();
  });

  const shouldDescribeApp = function () {
    describe('root app', function () {
      it('should log undeployed app', async function () {
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/not yet deployed/);
      });

      it('should log plain app info', async function () {
        await push({ network, txParams, networkFile: this.networkFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/deployed at 0x[0-9a-fA-F]{40}/i);
        this.logs.text.should.match(/factory is at 0x[0-9a-fA-F]{40}/i);
        this.logs.text.should.match(/package is at 0x[0-9a-fA-F]{40}/i);
        this.logs.text.should.match(/version 1.1.0 matches/i);
        this.logs.text.should.match(/no contracts registered/i);
      });
    });
  };

  const shouldDescribeLib = function () {
    describe('root lib', function () {
      it('should log undeployed lib', async function () {
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/not yet deployed/);
      });

      it('should log plain lib info', async function () {
        await push({ network, txParams, networkFile: this.networkFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/library package is deployed at 0x[0-9a-fA-F]{40}/i);
      });
    });
  };

  const shouldDescribeVersion = function () {
    describe('version', function () {
      it('should log version out-of-sync', async function () {
        await push({ network, txParams, networkFile: this.networkFile });
        await bumpVersion({ version: '1.2.0', packageFile: this.packageFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/version 1.1.0 is out of date/i);
        this.logs.text.should.match(/latest is 1.2.0/i);
      });
    });
  };

  const shouldDescribeContracts = function () {
    describe('contracts', function () {
      it('should log contract name when different to alias', async function () {
        await push({ network, txParams, networkFile: this.networkFile });
        await add({ contractsData, packageFile: this.packageFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/Impl/i);
        this.logs.text.should.match(/implemented by ImplV1/i);
      });  

      it('should not log contract name when matches alias', async function () {
        await push({ network, txParams, networkFile: this.networkFile });
        await add({ contractsData: [{ name: anotherContractName }], packageFile: this.packageFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/AnotherImplV1/i);
        this.logs.text.should.not.match(/implemented by/i);
      });  

      it('should log undeployed contract', async function () {
        await push({ network, txParams, networkFile: this.networkFile });
        await add({ contractsData, packageFile: this.packageFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/not deployed/i);
      });

      it('should log out-of-sync contract', async function () {
        await add({ contractsData, packageFile: this.packageFile });
        await push({ network, txParams, networkFile: this.networkFile });
        await add({ contractsData: [{ name: anotherContractName, alias: contractAlias }], packageFile: this.packageFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/out of date/i);
      });

      it('should log deployed contract', async function () {
        await add({ contractsData, packageFile: this.packageFile });
        await push({ network, txParams, networkFile: this.networkFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/is deployed and up to date/i);
      });    

      it('should log contract to be removed', async function () {
        await add({ contractsData, packageFile: this.packageFile });
        await push({ network, txParams, networkFile: this.networkFile });
        await remove({ contracts: [contractAlias], packageFile: this.packageFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/pending to be removed/i);
      });    
    });
  };

  const shouldDescribeNoStdlib = function () {
    it('should log app info', async function () {
      await push({ network, txParams, networkFile: this.networkFile });
      await status({ network, networkFile: this.networkFile });

      this.logs.text.should.match(/no stdlib specified for current version/i);
    });

    it('should log missing stdlib', async function () {
      await push({ network, txParams, networkFile: this.networkFile });
      await linkStdlib({ packageFile: this.packageFile, stdlibNameVersion, installLib: false });
      await status({ network, networkFile: this.networkFile });

      this.logs.text.should.match(/mock-stdlib@1.1.0 required/i);
      this.logs.text.should.match(/no stdlib is deployed/i);
    });
  }

  const shouldDescribeStdlib = function () {
    describe('stdlib', function () {
      it('should log connected stdlib', async function () {
        await push({ network, txParams, networkFile: this.networkFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/mock-stdlib@1.1.0 required/i);
        this.logs.text.should.match(/correctly connected to stdlib/i);
      });

      it('should log connected stdlib when semver requirement matches', async function () {
        await linkStdlib({ packageFile: this.packageFile, stdlibNameVersion: 'mock-stdlib@^1.0.0', installLib: false });
        await push({ network, txParams, networkFile: this.networkFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/mock-stdlib@\^1\.0\.0 required/i);
        this.logs.text.should.match(/correctly connected to stdlib/i);
        this.logs.text.should.match(/1\.1\.0/i);
      });

      it('should log different stdlib connected', async function () {
        await push({ network, txParams, networkFile: this.networkFile });
        await linkStdlib({ packageFile: this.packageFile, stdlibNameVersion: 'mock-stdlib-2@1.2.0', installLib: false });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/mock-stdlib-2@1.2.0 required/i);
        this.logs.text.should.match(/connected to different stdlib mock-stdlib@1.1.0/i);
      });

      it('should log deployed stdlib', async function () {
        await push({ network, txParams, deployStdlib: true, networkFile: this.networkFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/mock-stdlib@1.1.0 required/i);
        this.logs.text.should.match(/custom deploy of stdlib set at 0x[0-9a-fA-F]{40}/i);
      });

      it('should log different stdlib deployed', async function () {
        await push({ network, txParams, deployStdlib: true, networkFile: this.networkFile });
        await linkStdlib({ packageFile: this.packageFile, stdlibNameVersion: 'mock-stdlib-2@1.2.0', installLib: false });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/mock-stdlib-2@1.2.0 required/i);
        this.logs.text.should.match(/custom deploy of different stdlib mock-stdlib@1.1.0 at 0x[0-9a-fA-F]{40}/i);
      });
    });
  };

  const shouldDescribeProxies = function () {
    describe('proxies', function () {
      it('should log no proxies', async function () {
        await add({ contractsData, packageFile: this.packageFile });
        await push({ network, txParams, networkFile: this.networkFile });
        await status({ network, networkFile: this.networkFile });

        this.logs.text.should.match(/no proxies/i);
      });

      it('should log created proxies', async function () {
        await add({ contractsData, packageFile: this.packageFile });
        await push({ network, txParams, networkFile: this.networkFile });
        await createProxy({ contractAlias, network, txParams, networkFile: this.networkFile });
        await status({ network, networkFile: this.networkFile });
        
        this.logs.text.should.match(/Impl at 0x[0-9a-fA-F]{40} version 1.1.0/i);
      });
    });
  };

  const shouldNotModifyPackage = function () {
    it('should not deploy a new package', async function () {
      await push({ network, txParams, networkFile: this.networkFile });
      const packageAddress = ControllerFor(this.packageFile).onNetwork(network, txParams, this.networkFile).packageAddress;
      this.logs.clear();

      await status({ network, networkFile: this.networkFile });

      this.logs.text.should.not.match(/deploying new package/i);
      ControllerFor(this.packageFile).onNetwork(network, txParams, this.networkFile).packageAddress.should.eq(packageAddress);
    });
  }

  describe('on app project', function () {
    beforeEach('creating package and network files', function () {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
      this.networkFile = this.packageFile.networkFile(network)
    })

    shouldDescribeApp();
    shouldDescribeVersion();
    shouldDescribeContracts();
    shouldDescribeNoStdlib();
    shouldDescribeProxies();
    shouldNotModifyPackage();

    describe('with stdlib', function () {
      beforeEach('creating package and network files', function () {
        this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-stdlib.zos.json')
        this.networkFile = this.packageFile.networkFile(network)
      })

      shouldDescribeStdlib();
    })
  });

  describe('on lib project', function () {
    beforeEach('creating package and network files', function () {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty-lib.zos.json')
      this.networkFile = this.packageFile.networkFile(network)
    })

    shouldDescribeLib();
    shouldDescribeVersion();
    shouldDescribeContracts();
    shouldNotModifyPackage();
  });
});
