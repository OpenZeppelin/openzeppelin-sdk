'use strict';

import { stubContractUpgradeable } from '../setup';

import { mapKeys } from 'lodash';
import sinon from 'sinon';

import { Contracts, Proxy, ProxyAdminProject, AppProject } from '@openzeppelin/upgrades';
import { accounts } from '@openzeppelin/test-environment';

import CaptureLogs from '../helpers/captureLogs';

import ContractManager from '../../models/local/ContractManager';
import add from '../../scripts/add';
import push from '../../scripts/push';
import bump from '../../scripts/bump';
import link from '../../scripts/link';
import createProxy from '../../scripts/create';
import update from '../../scripts/update';
import setAdmin from '../../scripts/set-admin';
import ProjectFile from '../../models/files/ProjectFile';
import NetworkFile from '../../models/files/NetworkFile';
import { ProxyType } from '../../scripts/interfaces';

const sandbox = sinon.createSandbox();
const updateSandbox = sinon.createSandbox();

const ImplV1 = Contracts.getFromLocal('ImplV1');
const GreeterV1 = Contracts.getFromNodeModules('mock-stdlib', 'GreeterImpl');
const GreeterV2 = Contracts.getFromNodeModules('mock-stdlib-2', 'GreeterImpl');

describe('update script', function() {
  const [owner, anotherAccount] = accounts;

  const network = 'test';
  const version1 = '0.1.0';
  const version2 = '0.2.0';
  const txParams = { from: owner };

  stubContractUpgradeable(sandbox);

  const assertProxyInfo = async function(
    networkFile,
    contractName,
    proxyIndex,
    { version, implementation, address, value, minimal },
  ) {
    const proxyInfo = networkFile.getProxies({ contractName })[proxyIndex];
    if (address) proxyInfo.address.should.eq(address, 'Proxy address in network file does not match expected');
    else proxyInfo.address.should.be.nonzeroAddress;

    if (implementation) {
      proxyInfo.implementation.should.equalIgnoreCase(
        implementation,
        'Implementation address in network file does not match expected',
      );
    }

    if (!minimal && implementation) {
      const actualImplementation = await Proxy.at(proxyInfo.address).implementation();
      actualImplementation.should.equalIgnoreCase(
        implementation,
        'Proxy implementation address does not match expected',
      );
    }

    if (version) {
      proxyInfo.version.should.eq(version, 'Proxy version in network file does not match expected');
    }

    if (value) {
      const proxy = ImplV1.at(proxyInfo.address);
      const actualValue = await proxy.methods.value().call();
      actualValue.should.eq(`${value}`, 'Called method does not return expected value');
    }

    return proxyInfo;
  };

  const createProxies = async function() {
    this.networkFile = new NetworkFile(this.projectFile, network);

    const contracts = ['ImplV1', 'WithLibraryImplV1'];
    await add({ contracts, projectFile: this.projectFile });
    await push({ network, txParams, networkFile: this.networkFile });

    this.implV1Address = this.networkFile.contract('ImplV1').address;
    this.withLibraryImplV1Address = this.networkFile.contract('WithLibraryImplV1').address;

    this.proxy1 = await createProxy({
      contractName: 'ImplV1',
      network,
      txParams,
      networkFile: this.networkFile,
    });
    this.proxy2 = await createProxy({
      contractName: 'ImplV1',
      network,
      txParams,
      networkFile: this.networkFile,
    });
    this.proxy3 = await createProxy({
      contractName: 'WithLibraryImplV1',
      network,
      txParams,
      networkFile: this.networkFile,
    });
  };

  const bumpVersionAndPush = async function() {
    const contracts = ['ImplV1', 'WithLibraryImplV1', 'ImplV2', 'WithLibraryImplV2'];
    await bump({ version: version2, txParams, projectFile: this.projectFile });
    await add({
      contracts,
      projectFile: this.projectFile,
    });

    await push({ contracts, network, txParams, networkFile: this.networkFile });

    this.implV2Address = this.networkFile.contract('ImplV2').address;
    this.withLibraryImplV2Address = this.networkFile.contract('WithLibraryImplV2').address;
  };

  const stubUpdate = (mappingToNames, mappingToAddresses) => {
    updateSandbox.stub(ContractManager.prototype, 'getContractClass').callsFake(function(packageName, contractName) {
      return ContractManager.prototype.getContractClass.wrappedMethod.apply(this, [
        packageName,
        mappingToNames[contractName] ?? contractName,
      ]);
    });
    updateSandbox
      .stub(ProxyAdminProject.prototype, 'getImplementation')
      .callsFake(function({ packageName, contractName, contract }) {
        return ProxyAdminProject.prototype.getImplementation.wrappedMethod.apply(this, [
          {
            packageName,
            contractName: mappingToNames[contractName] ?? contractName,
            contract,
          },
        ]);
      });
    updateSandbox
      .stub(AppProject.prototype, 'getImplementation')
      .callsFake(function({ packageName, contractName, contract }) {
        return AppProject.prototype.getImplementation.wrappedMethod.apply(this, [
          {
            packageName,
            contractName: mappingToNames[contractName] ?? contractName,
            contract,
          },
        ]);
      });
    updateSandbox
      .stub(ProxyAdminProject.prototype, '_getOrDeployOwnImplementation')
      .callsFake(function(contract, contractName, redeployIfChanged) {
        return mappingToAddresses[contractName]
          ? Promise.resolve(mappingToAddresses[contractName])
          : ProxyAdminProject.prototype._getOrDeployOwnImplementation.wrappedMethod.apply(this, [
              contract,
              contractName,
              redeployIfChanged,
            ]);
      });
  };

  const restoreUpdate = () => {
    updateSandbox.resetBehavior();
    updateSandbox.restore();
  };

  const shouldHandleUpdateScript = function() {
    describe('updating', function() {
      beforeEach('setup', async function() {
        await createProxies.call(this);
        await bumpVersionAndPush.call(this);
        stubUpdate(
          { ImplV1: 'ImplV2', WithLibraryImplV1: 'WithLibraryImplV2' },
          { ImplV1: this.implV2Address, WithLibraryImplV1: this.withLibraryImplV2Address },
        );
      });
      afterEach(function() {
        restoreUpdate();
      });

      it('should upgrade the version of a proxy given its address', async function() {
        // Upgrade single proxy
        const proxyAddress = this.networkFile.getProxies({
          contractName: 'ImplV1',
        })[0].address;
        await update({
          proxyAddress,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 0, {
          version: version2,
          implementation: this.implV2Address,
          address: proxyAddress,
        });

        // Check other proxies were unmodified
        await assertProxyInfo(this.networkFile, 'ImplV1', 1, {
          version: version1,
          implementation: this.implV1Address,
        });
        await assertProxyInfo(this.networkFile, 'WithLibraryImplV1', 0, {
          version: version1,
          implementation: this.withLibraryImplV1Address,
        });
      });

      it('should upgrade the version of all proxies given the contract name', async function() {
        // Upgrade all 'ImplV1' proxies

        await update({
          contractName: 'ImplV1',
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 0, {
          version: version2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 1, {
          version: version2,
          implementation: this.implV2Address,
        });

        // Keep WithLibraryImpl unmodified
        await assertProxyInfo(this.networkFile, 'WithLibraryImplV1', 0, {
          version: version1,
          implementation: this.withLibraryImplV1Address,
        });
      });

      it('should upgrade the version of all proxies in the app', async function() {
        await update({
          all: true,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 0, {
          version: version2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 1, {
          version: version2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'WithLibraryImplV1', 0, {
          version: version2,
          implementation: this.withLibraryImplV2Address,
        });
      });

      it('should not attempt to upgrade a proxy not owned', async function() {
        const proxyAddress = this.networkFile.getProxies({
          contractName: 'ImplV1',
        })[0].address;
        await setAdmin({
          proxyAddress,
          newAdmin: anotherAccount,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await update({
          all: true,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 0, {
          version: version1,
          implementation: this.implV1Address,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 1, {
          version: version2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'WithLibraryImplV1', 0, {
          version: version2,
          implementation: this.withLibraryImplV2Address,
        });
      });

      it('should upgrade the remaining proxies if one was already upgraded', async function() {
        // Upgrade a single proxy
        const proxyAddress = this.networkFile.getProxies({
          contractName: 'ImplV1',
        })[0].address;
        await update({
          contractName: 'ImplV1',
          proxyAddress,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 0, {
          version: version2,
          implementation: this.implV2Address,
          address: proxyAddress,
        });

        // Upgrade all
        await update({
          all: true,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 1, {
          version: version2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'WithLibraryImplV1', 0, {
          version: version2,
          implementation: this.withLibraryImplV2Address,
        });
      });

      it('should upgrade a single proxy and migrate it', async function() {
        const proxyAddress = this.networkFile.getProxies({
          contractName: 'ImplV1',
        })[0].address;
        await update({
          contractName: 'ImplV1',
          methodName: 'migrate',
          methodArgs: [42],
          proxyAddress,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 0, {
          version: version2,
          implementation: this.implV2Address,
          address: proxyAddress,
          value: 42,
        });
      });

      it('should upgrade multiple proxies and migrate them', async function() {
        await update({
          contractName: 'ImplV1',
          methodName: 'migrate',
          methodArgs: [42],
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 0, {
          version: version2,
          implementation: this.implV2Address,
          value: 42,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 1, {
          version: version2,
          implementation: this.implV2Address,
          value: 42,
        });
      });

      it('should upgrade multiple proxies and migrate them', async function() {
        // add non-migratable implementation for WithLibraryImpl contract
        await add({
          contracts: ['UnmigratableImplV2'],
          projectFile: this.projectFile,
        });
        await push({ network, txParams, networkFile: this.networkFile });

        const unmigratableImplV2 = this.networkFile.contract('UnmigratableImplV2').address;

        restoreUpdate();
        stubUpdate(
          { ImplV1: 'UnmigratableImplV2', WithLibraryImplV1: 'WithLibraryImplV2' },
          { ImplV1: unmigratableImplV2, WithLibraryImplV1: this.withLibraryImplV2Address },
        );

        await update({
          all: true,
          methodName: 'migrate',
          methodArgs: [42],
          network,
          txParams,
          networkFile: this.networkFile,
        }).should.be.rejectedWith(/failed to upgrade/);

        await assertProxyInfo(this.networkFile, 'WithLibraryImplV1', 0, {
          version: version2,
          implementation: this.withLibraryImplV2Address,
        });
      });

      it('should refuse to upgrade a proxy to an undeployed contract', async function() {
        const contracts = this.networkFile.contracts;
        delete contracts['ImplV1'];
        this.networkFile.contracts = contracts;

        await update({
          contractName: 'ImplV1',
          proxyAddress: null,
          network,
          txParams,
          networkFile: this.networkFile,
        }).should.be.rejectedWith('Contracts ImplV1 are not deployed.');
      });

      describe('with local modifications', function() {
        beforeEach('changing local network file to have a different bytecode', async function() {
          const contracts = this.networkFile.contracts;
          contracts['ImplV1'].localBytecodeHash = '0xabcd';
          this.networkFile.contracts = contracts;
        });

        it('should refuse to upgrade a proxy for a modified contract', async function() {
          await update({
            contractName: 'ImplV1',
            network,
            txParams,
            networkFile: this.networkFile,
          }).should.be.rejectedWith('Contracts ImplV1 have changed since the last deploy.');
        });

        it('should upgrade a proxy for a modified contract if force is set', async function() {
          await update({
            contractName: 'ImplV1',
            network,
            txParams,
            force: true,
            networkFile: this.networkFile,
          });
          await assertProxyInfo(this.networkFile, 'ImplV1', 0, {
            version: version2,
            implementation: this.implV2Address,
          });
        });
      });

      describe('warnings', function() {
        beforeEach('capturing log output', function() {
          this.logs = new CaptureLogs();
        });

        afterEach(function() {
          this.logs.restore();
        });

        it('should not warn when migrating a contract', async function() {
          await update({
            contractName: 'ImplV1',
            network,
            txParams,
            methodName: 'migrate',
            methodArgs: [42],
            networkFile: this.networkFile,
          });
          this.logs.errors.should.have.lengthOf(0);
        });

        it('should not warn when a contract has no migrate method', async function() {
          await add({
            contracts: ['WithLibraryImplV1'],
            projectFile: this.projectFile,
          });
          await push({ network, txParams, networkFile: this.networkFile });

          await update({
            contractName: 'NoMigrate',
            network,
            txParams,
            networkFile: this.networkFile,
          });
          this.logs.errors.should.have.lengthOf(0);
        });
      });
    });
  };

  const shouldHandleUpdateWithMinimalProxies = function() {
    describe('updating with minimal proxies', function() {
      beforeEach('setup', async function() {
        await createProxies.call(this);
        await createProxy({
          kind: ProxyType.Minimal,
          contractName: 'ImplV1',
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await bumpVersionAndPush.call(this);
        stubUpdate(
          { ImplV1: 'ImplV2', WithLibraryImplV1: 'WithLibraryImplV2' },
          { ImplV1: this.implV2Address, WithLibraryImplV1: this.withLibraryImplV2Address },
        );
      });

      afterEach(function() {
        restoreUpdate();
      });

      it('should not attempt to upgrade a minimal proxy', async function() {
        await update({
          all: true,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 0, {
          version: version2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 1, {
          version: version2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'ImplV1', 2, {
          version: version1,
          implementation: this.implV1Address,
          minimal: true,
        });
        await assertProxyInfo(this.networkFile, 'WithLibraryImplV1', 0, {
          version: version2,
          implementation: this.withLibraryImplV2Address,
        });
      });
    });
  };

  const shouldHandleUpdateOnDependency = function() {
    describe('updating on dependency', function() {
      beforeEach('setup', async function() {
        this.networkFile = new NetworkFile(this.projectFile, network);

        await push({
          network,
          txParams,
          deployDependencies: true,
          networkFile: this.networkFile,
        });
        await createProxy({
          packageName: 'mock-stdlib-undeployed',
          contractName: 'GreeterImpl',
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await createProxy({
          packageName: 'mock-stdlib-undeployed',
          contractName: 'GreeterImpl',
          network,
          txParams,
          networkFile: this.networkFile,
        });

        await bump({
          version: version2,
          txParams,
          projectFile: this.projectFile,
        });
        await link({
          txParams,
          dependencies: ['mock-stdlib-undeployed-2@1.2.0'],
          projectFile: this.projectFile,
        });
        await push({
          network,
          txParams,
          deployDependencies: true,
          networkFile: this.networkFile,
        });

        // We modify the proxies' package to v2, so we can upgrade them, simulating an upgrade to mock-stdlib-undeployed
        this.networkFile.data.proxies = mapKeys(this.networkFile.data.proxies, (value, key) =>
          key.replace('mock-stdlib-undeployed', 'mock-stdlib-undeployed-2'),
        );
      });

      it('should upgrade the version of a proxy given its address', async function() {
        const proxyAddress = this.networkFile.getProxies({
          contractName: 'GreeterImpl',
        })[0].address;
        await update({
          proxyAddress,
          network,
          txParams,
          networkFile: this.networkFile,
        });

        await assertProxyInfo(this.networkFile, 'GreeterImpl', 0, {
          version: '1.2.0',
          address: proxyAddress,
        });
        const upgradedProxy = GreeterV2.at(proxyAddress);
        (await upgradedProxy.methods.version().call()).should.eq('1.2.0');

        const anotherProxyAddress = this.networkFile.getProxies({
          contractName: 'GreeterImpl',
        })[1].address;
        const notUpgradedProxy = GreeterV1.at(anotherProxyAddress);
        (await notUpgradedProxy.methods.version().call()).should.eq('1.1.0');
      });

      it('should upgrade the version of all proxies given their name', async function() {
        await update({
          packageName: 'mock-stdlib-undeployed-2',
          contractName: 'GreeterImpl',
          network,
          txParams,
          networkFile: this.networkFile,
        });

        const { address: proxyAddress } = await assertProxyInfo(this.networkFile, 'GreeterImpl', 0, {
          version: '1.2.0',
        });
        (
          await GreeterV2.at(proxyAddress)
            .methods.version()
            .call()
        ).should.eq('1.2.0');
        const { address: anotherProxyAddress } = await assertProxyInfo(this.networkFile, 'GreeterImpl', 0, {
          version: '1.2.0',
        });
        (
          await GreeterV2.at(anotherProxyAddress)
            .methods.version()
            .call()
        ).should.eq('1.2.0');
      });

      it('should upgrade the version of all proxies given their package', async function() {
        await update({
          packageName: 'mock-stdlib-undeployed-2',
          network,
          txParams,
          networkFile: this.networkFile,
        });

        const { address: proxyAddress } = await assertProxyInfo(this.networkFile, 'GreeterImpl', 0, {
          version: '1.2.0',
        });
        (
          await GreeterV2.at(proxyAddress)
            .methods.version()
            .call()
        ).should.eq('1.2.0');
        const { address: anotherProxyAddress } = await assertProxyInfo(this.networkFile, 'GreeterImpl', 0, {
          version: '1.2.0',
        });
        (
          await GreeterV2.at(anotherProxyAddress)
            .methods.version()
            .call()
        ).should.eq('1.2.0');
      });

      it('should upgrade the version of all proxies', async function() {
        await update({
          network,
          txParams,
          all: true,
          networkFile: this.networkFile,
        });

        const { address: proxyAddress } = await assertProxyInfo(this.networkFile, 'GreeterImpl', 0, {
          version: '1.2.0',
        });
        (
          await GreeterV2.at(proxyAddress)
            .methods.version()
            .call()
        ).should.eq('1.2.0');
        const { address: anotherProxyAddress } = await assertProxyInfo(this.networkFile, 'GreeterImpl', 0, {
          version: '1.2.0',
        });
        (
          await GreeterV2.at(anotherProxyAddress)
            .methods.version()
            .call()
        ).should.eq('1.2.0');
      });
    });
  };

  describe('on application contract', function() {
    beforeEach('setup package', async function() {
      this.projectFile = new ProjectFile('mocks/packages/package-empty.zos.json');
      this.projectFile.version = version1;
    });

    shouldHandleUpdateScript();
    shouldHandleUpdateWithMinimalProxies();
  });

  describe('on application contract in unpublished mode', function() {
    beforeEach('setup package', async function() {
      this.projectFile = new ProjectFile('mocks/packages/package-empty.zos.json');
      this.projectFile.publish = false;
      this.projectFile.version = version1;
    });

    shouldHandleUpdateScript();
    shouldHandleUpdateWithMinimalProxies();
  });

  describe('on dependency contract', function() {
    beforeEach('setup package', async function() {
      this.projectFile = new ProjectFile('mocks/packages/package-with-undeployed-stdlib.zos.json');
      this.projectFile.version = version1;
    });

    shouldHandleUpdateOnDependency();
  });

  describe('on dependency contract in unpublished mode', function() {
    beforeEach('setup package', async function() {
      this.projectFile = new ProjectFile('mocks/packages/package-with-undeployed-stdlib.zos.json');
      this.projectFile.publish = false;
      this.projectFile.version = version1;
    });

    shouldHandleUpdateOnDependency();
  });
});
