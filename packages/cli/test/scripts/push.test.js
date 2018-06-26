'use strict'
require('../setup')

import { Contracts, App, Package, FileSystem as fs } from 'zos-lib'

import push from '../../src/scripts/push.js';
import freeze from '../../src/scripts/freeze';
import add from '../../src/scripts/add';
import bumpVersion from '../../src/scripts/bump';
import ZosPackageFile from '../../src/models/files/ZosPackageFile';

const ImplV1 = Contracts.getFromLocal('ImplV1');
const PackageContract = Contracts.getFromNodeModules('zos-lib', 'Package');
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
      const _package = await PackageContract.at(this.networkFile.packageAddress);
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
      app.version.should.be.eq(defaultVersion);
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
      const deployed = await ImplV1.at(contract.address);
      (await deployed.say()).should.eq('V1');
    });

    it('should deploy contract instance', async function () {
      const address = this.networkFile.contract('Impl').address;
      const deployed = await ImplV1.at(address);
      (await deployed.say()).should.eq('V1');
    });

    it('should register instances in directory', async function () {
      const address = this.networkFile.contract('Impl').address;
      const _package = await Package.fetch(this.networkFile.package.address);
      (await _package.getImplementation(defaultVersion, 'Impl')).should.eq(address);
    });
  };

  const shouldRedeployContracts = function () {
    it('should not redeploy contracts if unmodified', async function () {
      const previousAddress = this.networkFile.contract('Impl').address
      await push({ networkFile: this.networkFile, network, txParams });
      this.networkFile.contract('Impl').address.should.eq(previousAddress);
    });

    it('should redeploy unmodified contract if forced', async function () {
      const previousAddress = this.networkFile.contract('Impl').address
      await push({ networkFile: this.networkFile, network, txParams, reupload: true });
      this.networkFile.contract('Impl').address.should.not.eq(previousAddress);
    });

    it('should redeploy contracts if modified', async function () {
      const contractData = this.networkFile.contract('Impl');
      const previousAddress = contractData.address
      contractData.bytecodeHash = '0xabab'
      this.networkFile.contracts = { 'Impl': contractData }
      this.networkFile.contracts = [contractData]

      await push({ networkFile: this.networkFile, network, txParams });

      this.networkFile.contract('Impl').address.should.not.eq(previousAddress);
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
      (await _package.getRelease('1.2.0')).address.should.eq(this.networkFile.providerAddress);
    });

    it('should upload contracts to new directory when bumping version', async function () {
      await bumpVersion({ version: '1.2.0', packageFile: this.networkFile.packageFile });
      await push({ networkFile: this.networkFile, network, txParams });

      const implementationAddreess = this.networkFile.contract('Impl').address;
      const _package = await Package.fetch(this.networkFile.package.address);
      (await _package.getImplementation('1.2.0', 'Impl')).should.eq(implementationAddreess);
    });
  };

  const shouldBumpVersionAndUnfreeze = function () {
    shouldBumpVersion()

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
  }

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
    });

    shouldDeployApp();
    shouldDeployProvider();
    shouldDeployContracts();
    shouldRedeployContracts();
    shouldBumpVersion();
  });

  describe('an app with stdlib', function () {
    const stdlibAddress = '0x0000000000000000000000000000000000000010';

    describe('when using a valid stdlib', function () {
      beforeEach('pushing package-stdlib', async function () {
        const packageFile = new ZosPackageFile('test/mocks/packages/package-with-stdlib.zos.json')
        this.networkFile = packageFile.networkFile(network)

        await push({ networkFile: this.networkFile, network, txParams })
      });

      shouldDeployApp();

      it('should set stdlib in deployed app', async function () {
        const app = await App.fetch(this.networkFile.appAddress);
        const stdlib = await app.currentStdlib();

        stdlib.should.eq(stdlibAddress);
      });

      it('should set address in network file', async function () {
        this.networkFile.stdlibAddress.should.eq(stdlibAddress);
      });
    })

    describe('when using an invalid stdlib', function () {
      beforeEach('building network file', async function () {
        const packageFile = new ZosPackageFile('test/mocks/packages/package-with-invalid-stdlib.zos.json')
        this.networkFile = packageFile.networkFile(network)
      });

      it('should set address in network file', async function () {
        await push({ network, txParams, networkFile: this.networkFile })
          .should.be.rejectedWith('Requested stdlib version 1.0.0 does not match stdlib network package version 3.0.0')
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
    shouldRedeployContracts();
    shouldBumpVersionAndUnfreeze();

    it('should refuse to push when frozen', async function() {
      await freeze({ network, txParams, networkFile: this.networkFile })
      await push({ network, txParams, networkFile: this.networkFile }).should.be.rejectedWith(/frozen/i)
    });
  });

  describe('an app with invalid contracts', function() {
    beforeEach('pushing package-with-contracts', async function () {
      const packageFile = new ZosPackageFile('test/mocks/packages/package-with-invalid-contracts.zos.json')
      this.networkFile = packageFile.networkFile(network)

      await push({ networkFile: this.networkFile, network, txParams }).should.be.rejectedWith(/WithFailingConstructor deployment failed/);
    });

    shouldDeployApp();
    shouldDeployProvider();
    shouldDeployContracts();
  });
});
