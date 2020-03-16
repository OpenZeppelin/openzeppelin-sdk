'use strict';

import { stubContractUpgradeable } from '../setup';

import { expect } from 'chai';

const upgrades = require('@openzeppelin/upgrades'); // eslint-disable-line @typescript-eslint/no-var-requires
import { ZWeb3, Contracts, App, Package, ProxyAdmin, ProxyFactory } from '@openzeppelin/upgrades';
import { accounts } from '@openzeppelin/test-environment';

import sinon from 'sinon';
import push from '../../scripts/push';
import freeze from '../../scripts/freeze';
import add from '../../scripts/add';
import bumpVersion from '../../scripts/bump';
import ProjectFile from '../../models/files/ProjectFile';
import NetworkFile from '../../models/files/NetworkFile';
import remove from '../../scripts/remove';
import Dependency from '../../models/dependency/Dependency';
import CaptureLogs from '../helpers/captureLogs';

const should = require('chai').should();

const ImplV1 = Contracts.getFromLocal('ImplV1');
const WithLibraryImplV1 = Contracts.getFromLocal('WithLibraryImplV1');
const ImplementationDirectory = Contracts.getFromNodeModules('@openzeppelin/upgrades', 'ImplementationDirectory');

const sandbox = sinon.createSandbox();

describe('push script', function() {
  const [owner] = accounts;

  const network = 'test';
  const txParams = { from: owner };
  const defaultVersion = '1.1.0';

  stubContractUpgradeable(sandbox);

  const shouldDeployPackage = function() {
    it('should create a network file with version info', async function() {
      this.networkFile.isCurrentVersion(defaultVersion).should.be.true;
    });

    it('should include deployment addresses', async function() {
      this.networkFile.packageAddress.should.be.nonzeroAddress;
      this.networkFile.providerAddress.should.be.nonzeroAddress;
    });

    it('should deploy package at specified address', async function() {
      const _package = Package.fetch(this.networkFile.packageAddress);
      (await _package.hasVersion(defaultVersion)).should.be.true;
    });
  };

  const shouldDeployProvider = function() {
    it('should deploy provider at specified address', async function() {
      const directory = ImplementationDirectory.at(this.networkFile.providerAddress);
      (await directory.methods.getImplementation('foo').call()).should.be.zeroAddress;
    });
  };

  const shouldDeployApp = function() {
    shouldDeployPackage();

    it('should deploy app at specified address', async function() {
      const address = this.networkFile.appAddress;
      address.should.be.nonzeroAddress;

      const app = await App.fetch(address);
      const hasPackage = await app.hasPackage(this.networkFile.projectFile.name, defaultVersion);
      hasPackage.should.be.true;
    });
  };

  const shouldDeployContracts = function() {
    it('should record contracts in network file', async function() {
      const contract = this.networkFile.contract('ImplV1');
      contract.address.should.be.nonzeroAddress;
      contract.localBytecodeHash.should.not.be.empty;
      contract.storage.should.not.be.empty;
      contract.types.should.not.be.empty;
      const deployed = await ImplV1.at(contract.address);
      (await deployed.methods.say().call()).should.eq('V1');
    });

    it('should deploy contract instance', async function() {
      const address = this.networkFile.contract('ImplV1').address;
      const deployed = await ImplV1.at(address);
      (await deployed.methods.say().call()).should.eq('V1');
    });

    it('should deploy required libraries', async function() {
      const address = this.networkFile.solidityLib('UintLib').address;
      const code = await ZWeb3.eth.getCode(address);
      const uintLib = Contracts.getFromLocal('UintLib');
      code.length.should.eq(uintLib.schema.deployedBytecode.length).and.be.greaterThan(40);
    });

    it('should deploy and link contracts that require libraries', async function() {
      const address = this.networkFile.contract('WithLibraryImplV1').address;
      const deployed = await WithLibraryImplV1.at(address);
      const result = await deployed.methods.double(10).call();
      result.should.eq('20');
    });
  };

  const shouldRegisterContractsInDirectory = function() {
    it('should register instances in directory', async function() {
      const address = this.networkFile.contract('ImplV1').address;
      const _package = Package.fetch(this.networkFile.package.address);
      (await _package.getImplementation(defaultVersion, 'ImplV1')).should.eq(address);
    });
  };

  const shouldRedeployContracts = function() {
    beforeEach('loading previous addresses', function() {
      this.previousAddress = this.networkFile.contract('ImplV1').address;
      this.withLibraryPreviousAddress = this.networkFile.contract('WithLibraryImplV1').address;
    });

    it('should not redeploy contracts if unmodified', async function() {
      await push({ networkFile: this.networkFile, network, txParams });
      this.networkFile.contract('ImplV1').address.should.eq(this.previousAddress);
    });

    it('should redeploy unmodified contract if forced', async function() {
      await push({
        networkFile: this.networkFile,
        network,
        txParams,
        reupload: true,
      });
      this.networkFile.contract('ImplV1').address.should.not.eq(this.previousAddress);
    });

    it('should redeploy contracts if modified', async function() {
      modifyBytecode.call(this, 'ImplV1');
      await push({ networkFile: this.networkFile, network, txParams });
      this.networkFile.contract('ImplV1').address.should.not.eq(this.previousAddress);
    });

    it('should redeploy contracts if library is modified', async function() {
      modifyLibraryBytecode.call(this, 'UintLib');
      await push({ networkFile: this.networkFile, network, txParams });
      this.networkFile.contract('WithLibraryImplV1').address.should.not.eq(this.withLibraryPreviousAddress);
    });

    it('should not redeploy contracts if library is unmodified', async function() {
      await push({ networkFile: this.networkFile, network, txParams });
      this.networkFile.contract('WithLibraryImplV1').address.should.eq(this.withLibraryPreviousAddress);
    });

    context('validations', function() {
      beforeEach('modifying contracts', function() {
        modifyBytecode.call(this, 'ImplV1');
        modifyStorageInfo.call(this, 'ImplV1');
      });

      it('should refuse to redeploy a contract if storage is incompatible', async function() {
        await push({
          networkFile: this.networkFile,
          network,
          txParams,
        }).should.be.rejectedWith(/have validation errors/);
        this.networkFile.contract('ImplV1').address.should.eq(this.previousAddress);
      });

      it('should redeploy contract ignoring warnings', async function() {
        await push({
          force: true,
          networkFile: this.networkFile,
          network,
          txParams,
        });
        this.networkFile.contract('ImplV1').address.should.not.eq(this.previousAddress);
      });

      it('should refuse to redeploy a contract if validation throws', async function() {
        sandbox.stub(upgrades, 'validate').throws(new Error('Stubbed error during contract validation'));
        await push({
          networkFile: this.networkFile,
          network,
          txParams,
        }).should.be.rejectedWith(/have validation errors/);
        this.networkFile.contract('ImplV1').address.should.eq(this.previousAddress);
      });

      it('should redeploy contract skipping errors', async function() {
        sandbox.stub(upgrades, 'validate').throws(new Error('Stubbed error during contract validation'));
        await push({
          force: true,
          networkFile: this.networkFile,
          network,
          txParams,
        });
        this.networkFile.contract('ImplV1').address.should.not.eq(this.previousAddress);
      });

      afterEach(function() {
        sandbox.restore();
      });
    });
  };

  const shouldDeployOnlySpecifiedContracts = function() {
    describe('when contracts specified explicitly', function() {
      beforeEach('loading previous addresses', function() {
        this.previousAddress = this.networkFile.contract('ImplV1').address;
        this.withLibraryPreviousAddress = this.networkFile.contract('WithLibraryImplV1').address;
      });

      describe('when a NetworkFile is empty', function() {
        beforeEach('purging NetworkFile', function() {
          this.networkFile.data.contracts = {};
          this.networkFile.data.proxies = {};
        });

        it('should record contracts in network file', async function() {
          await push({ contracts: ['ImplV1'], networkFile: this.networkFile, network, txParams });

          const contract = this.networkFile.contract('ImplV1');
          contract.address.should.be.nonzeroAddress;
          contract.localBytecodeHash.should.not.be.empty;
          contract.storage.should.not.be.empty;
          contract.types.should.not.be.empty;
          const deployed = await ImplV1.at(contract.address);
          (await deployed.methods.say().call()).should.eq('V1');
        });

        it('should not record not specified contracts in network file', async function() {
          await push({ contracts: ['ImplV1'], networkFile: this.networkFile, network, txParams });

          const contract = this.networkFile.contract('WithLibraryImplV1');
          expect(contract).to.be.undefined;
        });

        it('should deploy contract instance', async function() {
          await push({ contracts: ['ImplV1'], networkFile: this.networkFile, network, txParams });

          const address = this.networkFile.contract('ImplV1').address;
          const deployed = await ImplV1.at(address);
          (await deployed.methods.say().call()).should.eq('V1');
        });

        it('should deploy required libraries', async function() {
          await push({ contracts: ['WithLibraryImplV1'], networkFile: this.networkFile, network, txParams });

          const address = this.networkFile.solidityLib('UintLib').address;
          const code = await ZWeb3.eth.getCode(address);
          const uintLib = Contracts.getFromLocal('UintLib');
          code.length.should.eq(uintLib.schema.deployedBytecode.length).and.be.greaterThan(40);
        });

        it('should deploy and link contracts that require libraries', async function() {
          await push({ contracts: ['WithLibraryImplV1'], networkFile: this.networkFile, network, txParams });

          const address = this.networkFile.contract('WithLibraryImplV1').address;
          const deployed = await WithLibraryImplV1.at(address);
          const result = await deployed.methods.double(10).call();
          result.should.eq('20');
        });
      });

      describe('on a redeploy', function() {
        it('should not deploy contracts if unmodified', async function() {
          await push({ contracts: ['ImplV1'], networkFile: this.networkFile, network, txParams });
          this.networkFile.contract('ImplV1').address.should.eq(this.previousAddress);
        });

        it('should deploy unmodified contract if forced', async function() {
          await push({
            contracts: ['ImplV1'],
            networkFile: this.networkFile,
            network,
            txParams,
            reupload: true,
          });
          this.networkFile.contract('ImplV1').address.should.not.eq(this.previousAddress);
        });

        it('should deploy contracts if modified', async function() {
          modifyBytecode.call(this, 'ImplV1');
          await push({ contracts: ['ImplV1'], networkFile: this.networkFile, network, txParams });
          this.networkFile.contract('ImplV1').address.should.not.eq(this.previousAddress);
        });

        it('should not deploy contracts if library is modified', async function() {
          modifyLibraryBytecode.call(this, 'UintLib');
          await push({ contracts: ['ImplV1'], networkFile: this.networkFile, network, txParams });
          this.networkFile.contract('WithLibraryImplV1').address.should.eq(this.withLibraryPreviousAddress);
        });
      });

      context('validations', function() {
        beforeEach('modifying contracts', function() {
          modifyBytecode.call(this, 'ImplV1');
          modifyStorageInfo.call(this, 'ImplV1');
        });

        it('should refuse to deploy a contract if storage is incompatible', async function() {
          await push({
            contracts: ['ImplV1'],
            networkFile: this.networkFile,
            network,
            txParams,
          }).should.be.rejectedWith(/have validation errors/);
          this.networkFile.contract('ImplV1').address.should.eq(this.previousAddress);
        });

        it('should deploy contract ignoring warnings', async function() {
          await push({
            contracts: ['ImplV1'],
            force: true,
            networkFile: this.networkFile,
            network,
            txParams,
          });
          this.networkFile.contract('ImplV1').address.should.not.eq(this.previousAddress);
        });

        it('should refuse to deploy a contract if validation throws', async function() {
          sandbox.stub(upgrades, 'validate').throws(new Error('Stubbed error during contract validation'));
          await push({
            contracts: ['ImplV1'],
            networkFile: this.networkFile,
            network,
            txParams,
          }).should.be.rejectedWith(/have validation errors/);
          this.networkFile.contract('ImplV1').address.should.eq(this.previousAddress);
        });

        it('should deploy contract skipping errors', async function() {
          sandbox.stub(upgrades, 'validate').throws(new Error('Stubbed error during contract validation'));
          await push({
            contracts: ['ImplV1'],
            force: true,
            networkFile: this.networkFile,
            network,
            txParams,
          });
          this.networkFile.contract('ImplV1').address.should.not.eq(this.previousAddress);
        });

        afterEach(function() {
          sandbox.restore();
        });
      });
    });
  };

  const shouldValidateContracts = function() {
    describe('validations', function() {
      beforeEach('capturing log output', function() {
        this.logs = new CaptureLogs();
      });

      afterEach(function() {
        this.logs.restore();
      });

      it('should refuse to push a contract with validation error', async function() {
        add({
          contracts: ['WithConstructor'],
          projectFile: this.networkFile.projectFile,
        });
        await push({
          networkFile: this.networkFile,
          network,
          txParams,
        }).should.be.rejectedWith(/One or more contracts have validation errors/i);

        this.logs.errors.should.have.lengthOf(1);
        this.logs.errors[0].should.match(/constructor/i);
      });

      it('should push a contract with validation error if forced', async function() {
        add({
          contracts: ['WithConstructor'],
          projectFile: this.networkFile.projectFile,
        });
        await push({
          networkFile: this.networkFile,
          network,
          txParams,
          force: true,
        });

        this.logs.errors.should.have.lengthOf(1);
        this.logs.errors[0].should.match(/constructor/i);

        const contract = this.networkFile.contract('WithConstructor');
        contract.address.should.be.nonzeroAddress;
      });

      it('should only report new validation errors', async function() {
        add({
          contracts: ['WithConstructor'],
          projectFile: this.networkFile.projectFile,
        });
        await push({
          networkFile: this.networkFile,
          network,
          txParams,
          force: true,
        });
        const previousAddress = this.networkFile.contract('WithConstructor').address;

        this.logs.clear();
        modifyBytecode.call(this, 'WithConstructor');
        await push({ networkFile: this.networkFile, network, txParams });

        this.logs.errors.should.have.lengthOf(0);
        const contract = this.networkFile.contract('WithConstructor');
        contract.address.should.not.eq(previousAddress);
      });

      it('should only validate modified contracts', async function() {
        add({
          contracts: ['WithConstructor'],
          projectFile: this.networkFile.projectFile,
        });
        await push({
          networkFile: this.networkFile,
          network,
          txParams,
          force: true,
        });
        const previousAddress = this.networkFile.contract('ImplV1').address;

        this.logs.clear();
        modifyBytecode.call(this, 'ImplV1');
        await push({ networkFile: this.networkFile, network, txParams });

        this.logs.errors.should.have.lengthOf(0);
        this.networkFile.contract('ImplV1').address.should.not.eq(previousAddress);
      });
    });
  };

  const shouldBumpVersion = function() {
    it('should keep package address when bumping version', async function() {
      const previousPackage = this.networkFile.packageAddress;
      await bumpVersion({
        version: '1.2.0',
        projectFile: this.networkFile.projectFile,
      });

      await push({ networkFile: this.networkFile, network, txParams });

      this.networkFile.packageAddress.should.eq(previousPackage);
    });

    it('should update provider address when bumping version', async function() {
      await bumpVersion({
        version: '1.2.0',
        projectFile: this.networkFile.projectFile,
      });
      await push({ networkFile: this.networkFile, network, txParams });

      const _package = Package.fetch(this.networkFile.package.address);
      (await _package.getDirectory('1.2.0')).address.should.eq(this.networkFile.providerAddress);
    });

    it('should upload contracts to new directory when bumping version', async function() {
      await bumpVersion({
        version: '1.2.0',
        projectFile: this.networkFile.projectFile,
      });
      await push({ networkFile: this.networkFile, network, txParams });
      const implementationAddress = this.networkFile.contract('ImplV1').address;
      const _package = Package.fetch(this.networkFile.package.address);
      (await _package.getImplementation('1.2.0', 'ImplV1')).should.eq(implementationAddress);
    });

    it('should set frozen back to false', async function() {
      await bumpVersion({
        version: '1.1.0',
        projectFile: this.newNetworkFile.projectFile,
      });
      await push({ network, txParams, networkFile: this.newNetworkFile });
      await freeze({ network, txParams, networkFile: this.newNetworkFile });
      this.newNetworkFile.frozen.should.be.true;

      await bumpVersion({
        version: '1.2.0',
        projectFile: this.newNetworkFile.projectFile,
      });
      await add({
        contracts: ['ImplV1'],
        projectFile: this.newNetworkFile.projectFile,
      });
      await push({ network, txParams, networkFile: this.newNetworkFile });
      this.newNetworkFile.frozen.should.be.false;
    });
  };

  const shouldDeleteContracts = function({ unregisterFromDirectory }) {
    it('should delete contracts', async function() {
      await remove({
        contracts: ['ImplV1'],
        projectFile: this.networkFile.projectFile,
      });
      await push({ network, txParams, networkFile: this.networkFile });

      if (unregisterFromDirectory) {
        const _package = Package.fetch(this.networkFile.package.address);
        (await _package.getImplementation(defaultVersion, 'ImplV1')).should.be.zeroAddress;
      }
      should.not.exist(this.networkFile.contract('ImplV1'));
    });
  };

  const shouldSetDependency = function() {
    const libName = 'mock-stdlib';
    const libVersion = '1.1.0';

    it('should set dependency in deployed app', async function() {
      if (!this.networkFile.appAddress) return;
      const app = await App.fetch(this.networkFile.appAddress);
      const packageInfo = await app.getPackage(libName);
      packageInfo.version.should.be.semverEqual(libVersion);
      packageInfo.package.address.should.eq(this.dependencyPackage.address);
    });

    it('should set address and version in network file', async function() {
      const dependency = this.networkFile.getDependency(libName);
      dependency.version.should.be.semverEqual(libVersion);
      dependency.package.should.eq(this.dependencyPackage.address);
    });
  };

  const shouldUpdateDependency = function() {
    describe('updating dependency', function() {
      const newVersion = '1.2.0';

      beforeEach('deploying new dependency version', async function() {
        const mockStdlibPackage = new ProjectFile('mocks/mock-stdlib/zos.json');
        mockStdlibPackage.version = newVersion;
        sandbox.stub(Dependency.prototype, 'projectFile').get(function getterFn() {
          return mockStdlibPackage;
        });

        await this.dependencyPackage.newVersion(newVersion);
        this.dependencyGetNetworkFileStub.callsFake(() => ({
          packageAddress: this.dependencyPackage.address,
          version: newVersion,
        }));

        this.networkFile.projectFile.setDependency('mock-stdlib', newVersion);
      });

      beforeEach('running new push', async function() {
        await push({ networkFile: this.networkFile, network, txParams });
      });

      it('should update dependency to new version in network file', async function() {
        const dependency = this.networkFile.getDependency('mock-stdlib');
        dependency.package.should.eq(this.dependencyPackage.address);
        dependency.version.should.be.semverEqual(newVersion);
      });

      it('should update dependency to new version in app', async function() {
        if (!this.networkFile.appAddress) return;
        const app = await App.fetch(this.networkFile.appAddress);
        const packageInfo = await app.getPackage('mock-stdlib');
        packageInfo.package.address.should.eq(this.dependencyPackage.address);
        packageInfo.version.should.be.semverEqual(newVersion);
      });
    });
  };

  const shouldNotPushWhileFrozen = function() {
    it('should refuse to push when frozen upon modified contracts', async function() {
      await freeze({ network, txParams, networkFile: this.networkFile });
      modifyBytecode.call(this, 'ImplV1');
      await push({
        network,
        txParams,
        networkFile: this.networkFile,
      }).should.be.rejectedWith(/frozen/i);
    });

    it('should refuse to push when frozen upon modified libraries', async function() {
      await freeze({ network, txParams, networkFile: this.networkFile });
      modifyLibraryBytecode.call(this, 'UintLib');
      await push({
        network,
        txParams,
        networkFile: this.networkFile,
      }).should.be.rejectedWith(/frozen/i);
    });
  };

  const deployingDependency = function() {
    beforeEach('deploying dependency', async function() {
      const dependency = Dependency.fromNameWithVersion('mock-stdlib@1.1.0');
      this.dependencyProject = await dependency.deploy();
      this.dependencyPackage = await this.dependencyProject.getProjectPackage();
      this.dependencyGetNetworkFileStub = sandbox.stub(Dependency.prototype, 'getNetworkFile');
      this.dependencyGetNetworkFileStub.callsFake(() => ({
        packageAddress: this.dependencyPackage.address,
        version: '1.1.0',
      }));
    });

    afterEach('unstub dependency network file stub', function() {
      sandbox.restore();
    });
  };

  const shouldPushHelperContracts = function() {
    describe('on pushing helper contracts', function() {
      beforeEach('pushing', async function() {
        await push({
          deployProxyAdmin: true,
          deployProxyFactory: true,
          network,
          txParams,
          networkFile: this.networkFile,
        });
      });

      it('should deploy proxy admin', async function() {
        const proxyAdminAddress = this.networkFile.proxyAdminAddress;
        should.exist(proxyAdminAddress);
        const adminOwner = await ProxyAdmin.fetch(proxyAdminAddress).getOwner();
        adminOwner.should.eq(owner);
      });

      it('should deploy proxy factory', async function() {
        const proxyFactoryAddress = this.networkFile.proxyFactoryAddress;
        should.exist(proxyFactoryAddress);
        const deploymentAddress = await ProxyFactory.fetch(proxyFactoryAddress).getDeploymentAddress('42');
        deploymentAddress.should.be.nonzeroAddress;
      });

      it('should not redeploy helper contracts if present', async function() {
        const proxyAdminAddress = this.networkFile.proxyAdminAddress;
        const proxyFactoryAddress = this.networkFile.proxyFactoryAddress;
        await push({
          deployProxyAdmin: true,
          deployProxyFactory: true,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        this.networkFile.proxyAdminAddress.should.eq(proxyAdminAddress);
        this.networkFile.proxyFactoryAddress.should.eq(proxyFactoryAddress);
      });
    });
  };

  describe('an empty app', function() {
    beforeEach('setting package-empty', async function() {
      const projectFile = new ProjectFile('mocks/packages/package-empty.zos.json');
      this.networkFile = new NetworkFile(projectFile, network);
    });

    describe('on push', function() {
      beforeEach('pushing', async function() {
        await push({ network, txParams, networkFile: this.networkFile });
      });

      shouldDeployApp();
      shouldDeployProvider();
    });

    shouldPushHelperContracts();
  });

  describe('an app with contracts', function() {
    beforeEach('setting package-with-contracts', async function() {
      const projectFile = new ProjectFile('mocks/packages/package-with-contracts.zos.json');
      this.networkFile = new NetworkFile(projectFile, network);
    });

    describe('on push', function() {
      beforeEach('pushing', async function() {
        await push({ network, txParams, networkFile: this.networkFile });
        const newProjectFile = new ProjectFile('mocks/packages/package-with-contracts-v2.zos.json');
        this.newNetworkFile = new NetworkFile(newProjectFile, network);
      });

      shouldDeployApp();
      shouldDeployProvider();
      shouldDeployContracts();
      shouldDeployOnlySpecifiedContracts();
      shouldRegisterContractsInDirectory();
      shouldRedeployContracts();
      shouldValidateContracts();
      shouldBumpVersion();
      shouldNotPushWhileFrozen();
      shouldDeleteContracts({ unregisterFromDirectory: true });

      it('should notify if there was nothing to do since last push', async function() {
        const logs = new CaptureLogs();
        await push({ network, txParams, networkFile: this.networkFile });
        logs.text.should.match(/all implementations are up to date/i);
        logs.restore();
      });
    });

    shouldPushHelperContracts();
  });

  describe('an app with invalid contracts', function() {
    beforeEach('pushing package-with-invalid-contracts', async function() {
      const projectFile = new ProjectFile('mocks/packages/package-with-invalid-contracts.zos.json');
      this.networkFile = new NetworkFile(projectFile, network);

      await push({
        networkFile: this.networkFile,
        network,
        txParams,
        force: true,
      }).should.be.rejectedWith(/WithFailingConstructor deployment failed/);
    });

    shouldDeployApp();
    shouldDeployProvider();
  });

  describe('an app with dependency', function() {
    deployingDependency();

    describe('when using a valid dependency', function() {
      beforeEach('pushing package-stdlib', async function() {
        const projectFile = new ProjectFile('mocks/packages/package-with-stdlib.zos.json');
        this.networkFile = new NetworkFile(projectFile, network);

        await push({ networkFile: this.networkFile, network, txParams });
      });

      shouldDeployApp();
      shouldSetDependency();
      shouldUpdateDependency();
    });

    describe('when using a dependency with a version range', function() {
      beforeEach('pushing package-stdlib-range', async function() {
        const projectFile = new ProjectFile('mocks/packages/package-with-stdlib-range.zos.json');
        this.networkFile = new NetworkFile(projectFile, network);

        await push({ networkFile: this.networkFile, network, txParams });
      });

      shouldDeployApp();
      shouldSetDependency();
      shouldUpdateDependency();
    });
  });

  describe('an app with invalid dependency', function() {
    describe('when using an invalid dependency', function() {
      beforeEach('building network file', async function() {
        const projectFile = new ProjectFile('mocks/packages/package-with-invalid-stdlib.zos.json');
        this.networkFile = new NetworkFile(projectFile, network);
      });

      it('should fail to push', async function() {
        await push({
          network,
          txParams,
          networkFile: this.networkFile,
        }).should.be.rejectedWith(/Required dependency version 1.0.0 does not match version 2.0.0/);
      });
    });

    describe('when using an undeployed dependency', function() {
      beforeEach('building network file', async function() {
        const projectFile = new ProjectFile('mocks/packages/package-with-undeployed-stdlib.zos.json');
        this.networkFile = new NetworkFile(projectFile, network);
      });

      it('should fail to push', async function() {
        await push({
          network,
          txParams,
          networkFile: this.networkFile,
        }).should.be.rejectedWith(/Could not find a project file for network 'test' for 'mock-stdlib-undeployed'/);
      });
    });

    describe('when using an unpublished dependency', function() {
      beforeEach('building network file', async function() {
        const projectFile = new ProjectFile('mocks/packages/package-with-unpublished-stdlib.zos.json');
        this.networkFile = new NetworkFile(projectFile, network);
      });

      it('should fail to push', async function() {
        await push({
          network,
          txParams,
          networkFile: this.networkFile,
        }).should.be.rejectedWith(
          /Dependency 'mock-stdlib-unpublished' has not been published to network 'test', so it cannot be linked/,
        );
      });

      it('should create custom deployment', async function() {
        await push({
          network,
          txParams,
          networkFile: this.networkFile,
          deployDependencies: true,
        });
        const app = await App.fetch(this.networkFile.appAddress);
        const packageInfo = await app.getPackage('mock-stdlib-unpublished');
        packageInfo.version.should.be.semverEqual('1.1.0');
        packageInfo.package.address.should.be.nonzeroAddress;
      });
    });
  });

  describe('an empty unpublished project', function() {
    beforeEach('pushing package-empty-lite', async function() {
      const projectFile = new ProjectFile('mocks/packages/package-empty-lite.zos.json');
      this.networkFile = new NetworkFile(projectFile, network);
    });

    it('should run push', async function() {
      const logs = new CaptureLogs();
      await push({ network, txParams, networkFile: this.networkFile });
      logs.text.should.match(/all implementations are up to date/i);
      logs.restore();
    });

    shouldPushHelperContracts();
  });

  describe('an unpublished project with contracts', function() {
    beforeEach('setting package-with-contracts', async function() {
      const projectFile = new ProjectFile('mocks/packages/package-with-contracts.zos.json');
      projectFile.publish = false;
      this.networkFile = new NetworkFile(projectFile, network);
    });

    describe('on push', function() {
      beforeEach('pushing', async function() {
        await push({ network, txParams, networkFile: this.networkFile });
      });

      shouldDeployContracts();
      shouldDeployOnlySpecifiedContracts();
      shouldValidateContracts();
      shouldRedeployContracts();
      shouldDeleteContracts({ unregisterFromDirectory: false });

      it('should not reupload contracts after version bump', async function() {
        const previousAddress = this.networkFile.contract('ImplV1').address;
        await bumpVersion({
          version: '1.2.0',
          projectFile: this.networkFile.projectFile,
        });
        await push({ networkFile: this.networkFile, network, txParams });
        this.networkFile.version.should.eq('1.2.0');
        this.networkFile.contract('ImplV1').address.should.eq(previousAddress);
      });
    });

    shouldPushHelperContracts();
  });

  describe('an unpublished project with dependencies', function() {
    deployingDependency();

    beforeEach('pushing package-with-stdlib', async function() {
      const projectFile = new ProjectFile('mocks/packages/package-with-stdlib.zos.json');
      projectFile.publish = false;
      this.networkFile = new NetworkFile(projectFile, network);

      await push({ network, txParams, networkFile: this.networkFile });
    });

    shouldSetDependency();
    shouldUpdateDependency();
  });

  describe('an unpublished project with duplicated contracts', function() {
    deployingDependency();

    beforeEach('setting package-with-stdlib with two libs', async function() {
      const projectFile = new ProjectFile('mocks/packages/package-with-stdlib.zos.json');
      projectFile.publish = false;
      projectFile.addContract('ImplV1Clash', 'ImplV1Clash');
      this.networkFile = new NetworkFile(projectFile, network);
    });

    it.skip('fails nicely if there are duplicated contract names', async function() {
      const logs = new CaptureLogs();
      await push({
        network,
        txParams,
        networkFile: this.networkFile,
      }).should.be.rejectedWith(/validation errors/);
      logs.text.should.not.match(/Cannot read property 'forEach' of undefined/);
      logs.text.should.match(/There is more than one contract named GreeterImpl/);
      logs.restore();
    });
  });
});

function modifyBytecode(contractName) {
  const contractData = this.networkFile.contract(contractName);
  this.networkFile.setContract(contractName, {
    ...contractData,
    localBytecodeHash: '0xabcdef',
  });
}

function modifyLibraryBytecode(contractName) {
  const contractData = this.networkFile.solidityLib(contractName);
  this.networkFile.setSolidityLib(contractName, {
    ...contractData,
    localBytecodeHash: '0xabcdef',
  });
}

function modifyStorageInfo(contractName) {
  const contractData = this.networkFile.contract(contractName);
  const fakeVariable = {
    label: 'deleted',
    type: 't_uint256',
    contract: 'ImplV1',
  };
  const modifiedStorage = [fakeVariable, ...contractData.storage];
  this.networkFile.setContract(contractName, {
    ...contractData,
    storage: modifiedStorage,
  });
}
