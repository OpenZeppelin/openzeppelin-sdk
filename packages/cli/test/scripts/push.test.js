'use strict'
require('../setup')

import sinon from 'sinon'

import { Contracts, App, Package } from 'zos-lib'

import push from '../../src/scripts/push.js';
import freeze from '../../src/scripts/freeze';
import add from '../../src/scripts/add';
import bumpVersion from '../../src/scripts/bump';
import ZosPackageFile from '../../src/models/files/ZosPackageFile';
import remove from '../../src/scripts/remove';
import Dependency from '../../src/models/dependency/Dependency';
import CaptureLogs from '../helpers/captureLogs';

const should = require('chai').should();

const ImplV1 = Contracts.getFromLocal('ImplV1');
const ImplementationDirectory = Contracts.getFromNodeModules('zos-lib', 'ImplementationDirectory');

contract('push script', function([_, owner]) {
  const network = 'test';
  const txParams = { from: owner }
  const defaultVersion = '1.1.0';

  const shouldDeployPackage = function () {
    it('should create a network file with version info', async function() {
      this.networkFile.isCurrentVersion(defaultVersion).should.be.true;
    });

    it('should include deployment addresses', async function () {
      this.networkFile.packageAddress.should.be.nonzeroAddress;
      this.networkFile.providerAddress.should.be.nonzeroAddress;
    });

    it('should deploy package at specified address', async function () {
      const _package = await Package.fetch(this.networkFile.packageAddress);
      (await _package.hasVersion(defaultVersion)).should.be.true;
    });
  };

  const shouldDeployProvider = function () {
    it('should deploy provider at specified address', async function () {
      const directory = await ImplementationDirectory.at(this.networkFile.providerAddress);
      (await directory.getImplementation('foo')).should.be.zeroAddress;
    });
  };

  const shouldDeployApp = function () {
    shouldDeployPackage();

    it('should deploy app at specified address', async function () {
      const address = this.networkFile.appAddress;
      address.should.be.nonzeroAddress;

      const app = await App.fetch(address);
      const hasPackage = await app.hasPackage(this.networkFile.packageFile.name, defaultVersion)
      hasPackage.should.be.true
    });
  };

  const shouldDeployLib = function () {
    shouldDeployPackage();

    it('should not be frozen by default', async function() {
      this.networkFile.frozen.should.be.false;
    });
  };

  const shouldDeployContracts = function () {
    it('should record contracts in network file', async function () {
      const contract = this.networkFile.contract('Impl');
      contract.address.should.be.nonzeroAddress;
      contract.bytecodeHash.should.not.be.empty;
      contract.storage.should.not.be.empty;
      contract.types.should.not.be.empty;
      const deployed = await ImplV1.at(contract.address);
      (await deployed.say()).should.eq('V1');
    });

    it('should deploy contract instance', async function () {
      const address = this.networkFile.contract('Impl').address;
      const deployed = await ImplV1.at(address);
      (await deployed.say()).should.eq('V1');
    });
  };

  const shouldRegisterContractsInDirectory = function () {
    it('should register instances in directory', async function () {
      const address = this.networkFile.contract('Impl').address;
      const _package = await Package.fetch(this.networkFile.package.address);
      (await _package.getImplementation(defaultVersion, 'Impl')).should.eq(address);
    });
  }

  const shouldRedeployContracts = function () {
    beforeEach('loading previous address', function () {
      this.previousAddress = this.networkFile.contract('Impl').address
    })

    it('should not redeploy contracts if unmodified', async function () {
      await push({ networkFile: this.networkFile, network, txParams });
      this.networkFile.contract('Impl').address.should.eq(this.previousAddress);
    });

    it('should redeploy unmodified contract if forced', async function () {
      await push({ networkFile: this.networkFile, network, txParams, reupload: true });
      this.networkFile.contract('Impl').address.should.not.eq(this.previousAddress);
    });

    it('should redeploy contracts if modified', async function () {
      modifyBytecode.call(this, 'Impl');
      await push({ networkFile: this.networkFile, network, txParams });
      this.networkFile.contract('Impl').address.should.not.eq(this.previousAddress);
    });

    it('should refuse to redeploy a contract if storage is incompatible', async function () {
      modifyBytecode.call(this, 'Impl');
      modifyStorageInfo.call(this, 'Impl');
      await push({ networkFile: this.networkFile, network, txParams }).should.be.rejectedWith(/have validation errors/)
      this.networkFile.contract('Impl').address.should.eq(this.previousAddress);
    });

    it('should redeploy contract ignoring warnings', async function () {
      modifyBytecode.call(this, 'Impl');
      modifyStorageInfo.call(this, 'Impl');
      await push({ force: true, networkFile: this.networkFile, network, txParams });
      this.networkFile.contract('Impl').address.should.not.eq(this.previousAddress);
    });    
  }

  const shouldValidateContracts = function () {
    describe('validations', function () {
      beforeEach('capturing log output', function () {
        this.logs = new CaptureLogs();
      });

      afterEach(function () {
        this.logs.restore();
      });

      it('should refuse to push a contract with validation error', async function () {
        add({ contractsData: ['WithConstructor'], packageFile: this.networkFile.packageFile });
        await push({ networkFile: this.networkFile, network, txParams }).should.be.rejectedWith(/One or more contracts have validation errors/i)
        
        this.logs.errors.should.have.lengthOf(1);
        this.logs.errors[0].should.match(/constructor/i);
      })
      
      it('should push a contract with validation error if forced', async function () {
        add({ contractsData: ['WithConstructor'], packageFile: this.networkFile.packageFile });
        await push({ networkFile: this.networkFile, network, txParams, force: true });
        
        this.logs.errors.should.have.lengthOf(1);
        this.logs.errors[0].should.match(/constructor/i);

        const contract = this.networkFile.contract('WithConstructor');
        contract.address.should.be.nonzeroAddress;
      })

      it('should only report new validation errors', async function () {
        add({ contractsData: ['WithConstructor'], packageFile: this.networkFile.packageFile });
        await push({ networkFile: this.networkFile, network, txParams, force: true });
        const previousAddress = this.networkFile.contract('WithConstructor').address;
        
        this.logs.clear();
        modifyBytecode.call(this, 'WithConstructor');
        await push({ networkFile: this.networkFile, network, txParams});
        
        this.logs.errors.should.have.lengthOf(0);
        const contract = this.networkFile.contract('WithConstructor');
        contract.address.should.not.eq(previousAddress);
      })

      it('should only validate modified contracts', async function () {
        add({ contractsData: ['WithConstructor'], packageFile: this.networkFile.packageFile });
        await push({ networkFile: this.networkFile, network, txParams, force: true });
        const previousAddress = this.networkFile.contract('Impl').address;

        this.logs.clear();
        modifyBytecode.call(this, 'Impl');
        await push({ networkFile: this.networkFile, network, txParams});
        
        this.logs.errors.should.have.lengthOf(0);
        this.networkFile.contract('Impl').address.should.not.eq(previousAddress);
      })
    });
  }

  const shouldBumpVersion = function () {
    it('should keep package address when bumping version', async function () {
      const previousPackage = this.networkFile.packageAddress
      await bumpVersion({ version: '1.2.0', packageFile: this.networkFile.packageFile });

      await push({ networkFile: this.networkFile, network, txParams });

      this.networkFile.packageAddress.should.eq(previousPackage)
    });

    it('should update provider address when bumping version', async function () {
      await bumpVersion({ version: '1.2.0', packageFile: this.networkFile.packageFile });
      await push({ networkFile: this.networkFile, network, txParams });

      const _package = await Package.fetch(this.networkFile.package.address);
      (await _package.getDirectory('1.2.0')).address.should.eq(this.networkFile.providerAddress);
    });

    it('should upload contracts to new directory when bumping version', async function () {
      await bumpVersion({ version: '1.2.0', packageFile: this.networkFile.packageFile });
      await push({ networkFile: this.networkFile, network, txParams });
      const implementationAddress = this.networkFile.contract('Impl').address;
      const _package = await Package.fetch(this.networkFile.package.address);
      (await _package.getImplementation('1.2.0', 'Impl')).should.eq(implementationAddress);
    });

    it('should set frozen back to false', async function() {
      await bumpVersion({ version: '1.1.0', packageFile: this.newNetworkFile.packageFile  });
      await push({ network, txParams, networkFile: this.newNetworkFile })
      await freeze({ network, txParams, networkFile: this.newNetworkFile })
      this.newNetworkFile.frozen.should.be.true;

      await bumpVersion({ version: '1.2.0', packageFile: this.newNetworkFile.packageFile });
      await add({ contractsData: [{ name: 'ImplV1', alias: 'Impl' }], packageFile: this.newNetworkFile.packageFile });
      await push({ network, txParams, networkFile: this.newNetworkFile })
      this.newNetworkFile.frozen.should.be.false;
    });
  };

  const shouldDeleteContracts = function ({ unregisterFromDirectory }) {
    it('should delete contracts', async function () {
      await remove({ contracts: ['Impl'], packageFile: this.networkFile.packageFile });
      await push({ network, txParams, networkFile: this.networkFile });

      if (unregisterFromDirectory) {
        const _package = await Package.fetch(this.networkFile.package.address);
        (await _package.getImplementation(defaultVersion, 'Impl')).should.be.zeroAddress;
      }
      should.not.exist(this.networkFile.contract('Impl'));
    });
  };

  const shouldSetDependency = function () {
    const libName = 'mock-stdlib';
    const libVersion = '1.1.0';

    it('should set dependency in deployed app', async function () {
      const app = await App.fetch(this.networkFile.appAddress);
      const packageInfo = await app.getPackage(libName)
      packageInfo.version.should.be.semverEqual(libVersion)
      packageInfo.package.address.should.eq(this.dependencyPackage.address)
    });

    it('should set address and version in network file', async function () {
      const dependency = this.networkFile.getDependency(libName)
      dependency.version.should.be.semverEqual(libVersion)
      dependency.package.should.eq(this.dependencyPackage.address)
    });
  };

  const shouldMigrateToFullApp = function () {
    beforeEach('loading previous address', function () {
      this.previousAddress = this.networkFile.contract('Impl').address
    })

    describe('migration to full app', function () {
      beforeEach('migrating', async function () {
        await push({ full: true, network, txParams, networkFile: this.networkFile })
      })
  
      shouldDeployApp();

      it('should reuse contract implementations', async function () {
        const newImpl = await getImplementationFromApp.call(this, 'Impl');
        newImpl.should.eq(this.previousAddress);
      });

      it('should redeploy modified contract on app', async function () {
        modifyBytecode.call(this, 'Impl');
        await push({ networkFile: this.networkFile, network, txParams });

        const newImplFromApp = await getImplementationFromApp.call(this, 'Impl');
        const newImplFromFile = this.networkFile.contract('Impl').address;
        
        newImplFromApp.should.eq(newImplFromFile);
        newImplFromApp.should.not.eq(this.previousAddress);
      });
    })

    describe('migration with modified contracts', async function () {
      beforeEach('migrating', async function () {
        modifyBytecode.call(this, 'Impl');
        await push({ full: true, network, txParams, networkFile: this.networkFile });
      })

      it('should redeploy modified contract on app', async function () {
        const newImplFromApp = await getImplementationFromApp.call(this, 'Impl');
        const newImplFromFile = this.networkFile.contract('Impl').address;
        
        newImplFromApp.should.eq(newImplFromFile);
        newImplFromApp.should.not.eq(this.previousAddress);
      });
    })
  }

  const shouldNotPushWhileFrozen = function () {
    it('should refuse to push when frozen', async function() {
      await freeze({ network, txParams, networkFile: this.networkFile })
      await push({ network, txParams, networkFile: this.networkFile }).should.be.rejectedWith(/frozen/i)
    });
  };

  describe('an empty app', function() {
    beforeEach('pushing package-empty', async function () {
      const packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
      this.networkFile = packageFile.networkFile(network)

      await push({ network, txParams, networkFile: this.networkFile })
    });

    shouldDeployApp();
    shouldDeployProvider();
  });

  describe('an app with contracts', function() {
    beforeEach('pushing package-with-contracts', async function () {
      const packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts.zos.json')
      this.networkFile = packageFile.networkFile(network)

      await push({ network, txParams, networkFile: this.networkFile })

      const newPackageFile = new ZosPackageFile('test/mocks/packages/package-lib-with-contracts-v2.zos.json')
      this.newNetworkFile = newPackageFile.networkFile(network)
    });

    shouldDeployApp();
    shouldDeployProvider();
    shouldDeployContracts();
    shouldRegisterContractsInDirectory();
    shouldRedeployContracts();
    shouldValidateContracts();
    shouldBumpVersion();
    shouldNotPushWhileFrozen();
    shouldDeleteContracts({ unregisterFromDirectory: true });
  });

  describe('an app with invalid contracts', function() {
    beforeEach('pushing package-with-invalid-contracts', async function () {
      const packageFile = new ZosPackageFile('test/mocks/packages/package-with-invalid-contracts.zos.json')
      this.networkFile = packageFile.networkFile(network)

      await push({ networkFile: this.networkFile, network, txParams, force: true }).should.be.rejectedWith(/WithFailingConstructor deployment failed/);
    });

    shouldDeployApp();
    shouldDeployProvider();
    shouldDeployContracts();
    shouldRegisterContractsInDirectory();
  });

  describe('an app with dependency', function () {
    beforeEach('deploying dependency', async function () {
      const dependency = Dependency.fromNameWithVersion('mock-stdlib@1.1.0')
      this.dependencyProject = await dependency.deploy()
      this.dependencyPackage = await this.dependencyProject.getProjectPackage()

      this.dependencyNetworkFileStub = sinon.stub(Dependency.prototype, 'getNetworkFile')
      this.dependencyNetworkFileStub.callsFake(() => ({ packageAddress: this.dependencyPackage.address, version: '1.1.0' }))
    })

    afterEach('unstub dependency network file stub', function () {
      this.dependencyNetworkFileStub.restore()      
    })

    describe('when using a valid dependency', function () {
      beforeEach('pushing package-stdlib', async function () {
        const packageFile = new ZosPackageFile('test/mocks/packages/package-with-stdlib.zos.json')
        this.networkFile = packageFile.networkFile(network)

        await push({ networkFile: this.networkFile, network, txParams })
      });

      shouldDeployApp();
      shouldSetDependency();
    })

    describe('when using a dependency with a version range', function () {
      beforeEach('pushing package-stdlib-range', async function () {
        const packageFile = new ZosPackageFile('test/mocks/packages/package-with-stdlib-range.zos.json')
        this.networkFile = packageFile.networkFile(network)

        await push({ networkFile: this.networkFile, network, txParams })
      });

      shouldDeployApp();
      shouldSetDependency();
    })
  });

  describe('an app with invalid dependency', function () {
    describe('when using an invalid dependency', function () {
      beforeEach('building network file', async function () {
        const packageFile = new ZosPackageFile('test/mocks/packages/package-with-invalid-stdlib.zos.json')
        this.networkFile = packageFile.networkFile(network)
      });

      it('should fail to push', async function () {
        await push({ network, txParams, networkFile: this.networkFile })
          .should.be.rejectedWith(/Required dependency version 1.0.0 does not match dependency package version 2.0.0/)
      });
    })

    describe('when using an undeployed dependency', function () {
      beforeEach('building network file', async function () {
        const packageFile = new ZosPackageFile('test/mocks/packages/package-with-undeployed-stdlib.zos.json')
        this.networkFile = packageFile.networkFile(network)
      });

      it('should fail to push', async function () {
        await push({ network, txParams, networkFile: this.networkFile })
          .should.be.rejectedWith(/Could not find a zos file for network 'test' for 'mock-stdlib-undeployed'/)
      });
    })
  });

  describe('an empty lib', function() {
    beforeEach('pushing package-empty', async function () {
      const packageFile = new ZosPackageFile('test/mocks/packages/package-empty-lib.zos.json')
      this.networkFile = packageFile.networkFile(network)

      await push({ network, txParams, networkFile: this.networkFile })
    });

    shouldDeployLib(this.networkFile);
    shouldDeployProvider(this.networkFile);
  });

  describe('a lib with contracts', function() {
    beforeEach('pushing package-with-contracts', async function () {
      const packageFile = new ZosPackageFile('test/mocks/packages/package-lib-with-contracts.zos.json')
      this.networkFile = packageFile.networkFile(network)

      await push({ network, txParams, networkFile: this.networkFile })

      const newPackageFile = new ZosPackageFile('test/mocks/packages/package-lib-with-contracts-v2.zos.json')
      this.newNetworkFile = newPackageFile.networkFile(network)
    });

    shouldDeployLib();
    shouldDeployProvider();
    shouldDeployContracts();
    shouldRegisterContractsInDirectory();
    shouldValidateContracts();
    shouldRedeployContracts();
    shouldBumpVersion();
    shouldNotPushWhileFrozen();
    shouldDeleteContracts({ unregisterFromDirectory: true });
  });

  describe('an empty lightweight app', function() {
    beforeEach('pushing package-empty-lite', async function () {
      const packageFile = new ZosPackageFile('test/mocks/packages/package-empty-lite.zos.json')
      this.networkFile = packageFile.networkFile(network)
    });

    it('should run push', async function () {
      await push({ network, txParams, networkFile: this.networkFile })
    });

    describe('migration to full app', function () {
      beforeEach('migrating', async function () {
        await push({ network, txParams, networkFile: this.networkFile })
        await push({ full: true, network, txParams, networkFile: this.networkFile })
      });
      shouldDeployApp();
    });

    describe('migration from scratch', function () {
      beforeEach('migrating', async function () {
        await push({ full: true, network, txParams, networkFile: this.networkFile })
      });
      shouldDeployApp();
    });
  });

  describe('a lightweight app with contracts', function() {
    beforeEach('pushing package-with-contracts', async function () {
      const packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts.zos.json')
      packageFile.full = false
      this.networkFile = packageFile.networkFile(network)

      await push({ network, txParams, networkFile: this.networkFile })
    });

    shouldDeployContracts();
    shouldValidateContracts();
    shouldRedeployContracts();
    shouldDeleteContracts({ unregisterFromDirectory: false });
    shouldMigrateToFullApp();

    it('should not reupload contracts after version bump', async function () {
      const previousAddress = this.networkFile.contract('Impl').address
      await bumpVersion({ version: '1.2.0', packageFile: this.networkFile.packageFile });
      await push({ networkFile: this.networkFile, network, txParams });
      this.networkFile.version.should.eq('1.2.0')
      this.networkFile.contract('Impl').address.should.eq(previousAddress)
    })
  });

  describe('a lightweight app with invalid contracts', function() {
    beforeEach('pushing package-with-invalid-contracts', async function () {
      const packageFile = new ZosPackageFile('test/mocks/packages/package-with-invalid-contracts.zos.json')
      packageFile.full = false
      this.networkFile = packageFile.networkFile(network)

      await push({ networkFile: this.networkFile, network, txParams, force: true }).should.be.rejectedWith(/WithFailingConstructor deployment failed/);
    });

    shouldDeployContracts();
  });

  function modifyBytecode(contractAlias) {
    const contractData = this.networkFile.contract(contractAlias);
    this.networkFile.setContract(contractAlias, { ... contractData, bytecodeHash: '0xabcdef' })
  }

  async function getImplementationFromApp(contractAlias) {
    const app = await App.fetch(this.networkFile.appAddress);
    return await app.getImplementation(this.networkFile.packageFile.name, contractAlias);
  }
});

function modifyBytecode(contractAlias) {
  const contractData = this.networkFile.contract(contractAlias);
  this.networkFile.setContract(contractAlias, { ... contractData, bytecodeHash: '0xabcdef' })
}

function modifyStorageInfo(contractAlias) {
  const contractData = this.networkFile.contract(contractAlias);
  const fakeVariable = {label: 'deleted', type: 't_uint256', contract: 'ImplV1'};
  const modifiedStorage = [fakeVariable, ... contractData.storage]
  this.networkFile.setContract(contractAlias, { ... contractData, storage: modifiedStorage })
}