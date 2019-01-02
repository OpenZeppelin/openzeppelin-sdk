'use strict'
require('../setup')

import add from '../../src/scripts/add';
import push from '../../src/scripts/push';
import bumpVersion from '../../src/scripts/bump';
import createProxy from '../../src/scripts/create';
import status from '../../src/scripts/status';
import link from '../../src/scripts/link';
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
  const anotherContractName = 'WithLibraryImplV1';
  const dependencies = ['mock-stdlib@1.1.0'];
  
  beforeEach('setup', async function() {
    this.capturingLogs = ((promise) => {
      this.logs = new CaptureLogs();
      return promise;
    }).bind(this);
  });

  afterEach('cleanup', function () {
    if (this.logs) this.logs.restore();
  });

  const shouldDescribeApp = function () {
    describe('root app', function () {
      it('should log undeployed app', async function () {
        this.capturingLogs();
        await status({ network, networkFile: this.networkFile });
        this.logs.text.should.match(/not yet deployed/);
      });

      it('should log plain app info', async function () {
        await push({ network, txParams, networkFile: this.networkFile });
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/deployed at 0x[0-9a-fA-F]{40}/i);
        this.logs.text.should.match(/package \w+ is at 0x[0-9a-fA-F]{40}/i);
        this.logs.text.should.match(/version 1.1.0 matches/i);
        this.logs.text.should.match(/no contracts registered/i);
      });
    });
  };

  const shouldDescribeVersion = function () {
    describe('version', function () {
      it('should log version out-of-sync', async function () {
        await push({ network, txParams, networkFile: this.networkFile });
        await bumpVersion({ version: '1.2.0', packageFile: this.packageFile });
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

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
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/Impl/i);
        this.logs.text.should.match(/implemented by ImplV1/i);
      });  

      it('should not log contract name when matches alias', async function () {
        await push({ network, txParams, networkFile: this.networkFile });
        await add({ contractsData: [{ name: anotherContractName }], packageFile: this.packageFile });
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/WithLibraryImplV1/i);
        this.logs.text.should.not.match(/implemented by/i);
      });  

      it('should log undeployed contract', async function () {
        await push({ network, txParams, networkFile: this.networkFile });
        await add({ contractsData, packageFile: this.packageFile });
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/not deployed/i);
      });

      it('should log out-of-sync contract', async function () {
        await add({ contractsData, packageFile: this.packageFile });
        await push({ network, txParams, networkFile: this.networkFile });
        await add({ contractsData: [{ name: anotherContractName, alias: contractAlias }], packageFile: this.packageFile });
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/out of date/i);
      });

      it('should log deployed contract', async function () {
        await add({ contractsData, packageFile: this.packageFile });
        await push({ network, txParams, networkFile: this.networkFile });
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/is deployed and up to date/i);
      });    

      it('should log contract to be removed', async function () {
        await add({ contractsData, packageFile: this.packageFile });
        await push({ network, txParams, networkFile: this.networkFile });
        await remove({ contracts: [contractAlias], packageFile: this.packageFile });
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/will be removed/i);
      });    
    });
  };

  const shouldDescribeUnlinkedDependency = function () {
    it('should log missing library', async function () {
      await push({ network, txParams, networkFile: this.networkFile });
      await link({ packageFile: this.packageFile, dependencies, installLib: false });
      await this.capturingLogs(status({ network, networkFile: this.networkFile }));

      this.logs.text.should.match(/mock-stdlib@1.1.0 is required but is not linked/i);
    });
  }

  const shouldDescribeDependency = function () {
    describe('dependency', function () {
      it('should log connected dependency', async function () {
        await push({ network, txParams, deployDependencies: true, networkFile: this.networkFile });
        this.networkFile.updateDependency('mock-stdlib-undeployed', dep => ({ ... dep, customDeploy: false }))
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/mock-stdlib-undeployed@1.1.0 is linked/i);
      });

      it('should log connected dependency when semver requirement matches', async function () {
        await link({ packageFile: this.packageFile, dependencies: ['mock-stdlib-undeployed@^1.0.0'], installLib: false });
        await push({ network, txParams, deployDependencies: true, networkFile: this.networkFile });
        this.networkFile.updateDependency('mock-stdlib-undeployed', dep => ({ ... dep, customDeploy: false }))
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/mock-stdlib-undeployed@\^1\.0\.0 is linked to version 1\.1\.0/i);
      });

      it('should log connected dependency to incorrect version', async function () {
        await push({ network, txParams, deployDependencies: true, networkFile: this.networkFile });
        this.networkFile.updateDependency('mock-stdlib-undeployed', dep => ({ ... dep, customDeploy: false }))
        this.packageFile.setDependency('mock-stdlib-undeployed', '^2.0.0');
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/mock-stdlib-undeployed@\^2\.0\.0 is linked to a different version \(1\.1\.0\)/i);
      });

      it('should log deployed dependency', async function () {
        await push({ network, txParams, deployDependencies: true, networkFile: this.networkFile });
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/mock-stdlib-undeployed@1\.1\.0 is linked to a custom deployment/i);
      });

      it('should log deployed dependency to incorrect version', async function () {
        await push({ network, txParams, deployDependencies: true, networkFile: this.networkFile });
        this.packageFile.setDependency('mock-stdlib-undeployed', '^2.0.0');
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/mock-stdlib-undeployed@\^2\.0\.0 is linked to a custom deployment of a different version \(1\.1\.0\)/i);
      });
    });
  };

  const shouldDescribeProxies = function () {
    describe('proxies', function () {
      it('should log no proxies', async function () {
        await add({ contractsData, packageFile: this.packageFile });
        await push({ network, txParams, networkFile: this.networkFile });
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));

        this.logs.text.should.match(/no proxies/i);
      });

      it('should log created proxies', async function () {
        await add({ contractsData, packageFile: this.packageFile });
        await push({ network, txParams, networkFile: this.networkFile });
        await createProxy({ contractAlias, network, txParams, networkFile: this.networkFile });
        await this.capturingLogs(status({ network, networkFile: this.networkFile }));
        
        this.logs.text.should.match(/Impl at 0x[0-9a-fA-F]{40} version 1.1.0/i);
      });
    });
  };

  const shouldNotModifyPackage = function () {
    it('should not deploy a new package', async function () {
      await push({ network, txParams, networkFile: this.networkFile });
      const packageAddress = ControllerFor(this.packageFile).onNetwork(network, txParams, this.networkFile).packageAddress;

      await this.capturingLogs(status({ network, networkFile: this.networkFile }));

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
    shouldDescribeUnlinkedDependency();
    shouldDescribeProxies();
    shouldNotModifyPackage();

    describe('with dependency', function () {
      beforeEach('creating package and network files', function () {
        this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-undeployed-stdlib.zos.json')
        this.networkFile = this.packageFile.networkFile(network)
      })

      shouldDescribeDependency();
    })
  });

  describe('on unpublished project', function () {
    beforeEach('creating package and network files', function () {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
      this.packageFile.publish = false
      this.networkFile = this.packageFile.networkFile(network)
    })

    shouldDescribeContracts();
    shouldDescribeProxies();
  });

});
