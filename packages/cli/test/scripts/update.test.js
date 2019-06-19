'use strict';
require('../setup');

import mapKeys from 'lodash.mapkeys';
import omit from 'lodash.omit';
import { Contracts, Proxy } from 'zos-lib';
import CaptureLogs from '../helpers/captureLogs';

import add from '../../src/scripts/add';
import push from '../../src/scripts/push';
import bump from '../../src/scripts/bump';
import link from '../../src/scripts/link';
import createProxy from '../../src/scripts/create';
import update from '../../src/scripts/update';
import setAdmin from '../../src/scripts/set-admin';
import ZosPackageFile from '../../src/models/files/ZosPackageFile';
import utils from 'web3-utils';
import { ProxyType } from '../../src/scripts/interfaces';

const ImplV1 = Contracts.getFromLocal('ImplV1');
const ImplV2 = Contracts.getFromLocal('ImplV2');
const Greeter_V1 = Contracts.getFromNodeModules('mock-stdlib', 'GreeterImpl');
const Greeter_V2 = Contracts.getFromNodeModules('mock-stdlib-2', 'GreeterImpl');

contract('update script', function(accounts) {
  accounts = accounts.map(utils.toChecksumAddress);
  const [_skipped, owner, anotherAccount] = accounts;

  const network = 'test';
  const version_1 = '0.1.0';
  const version_2 = '0.2.0';
  const txParams = { from: owner };

  const assertProxyInfo = async function(
    networkFile,
    contractAlias,
    proxyIndex,
    { version, implementation, address, value, minimal },
  ) {
    const proxyInfo = networkFile.getProxies({ contract: contractAlias })[
      proxyIndex
    ];
    if (address)
      proxyInfo.address.should.eq(
        address,
        'Proxy address in network file does not match expected',
      );
    else proxyInfo.address.should.be.nonzeroAddress;

    if (implementation) {
      proxyInfo.implementation.should.equalIgnoreCase(
        implementation,
        'Implementation address in network file does not match expected',
      );
    }

    if (!minimal && implementation) {
      const actualImplementation = await Proxy.at(
        proxyInfo.address,
      ).implementation();
      actualImplementation.should.equalIgnoreCase(
        implementation,
        'Proxy implementation address does not match expected',
      );
    }

    if (version) {
      proxyInfo.version.should.eq(
        version,
        'Proxy version in network file does not match expected',
      );
    }

    if (value) {
      const proxy = ImplV1.at(proxyInfo.address);
      const actualValue = await proxy.methods.value().call();
      actualValue.should.eq(
        `${value}`,
        'Called method does not return expected value',
      );
    }

    return proxyInfo;
  };

  const createProxies = async function() {
    this.networkFile = this.packageFile.networkFile(network);

    const contractsData = [
      { name: 'ImplV1', alias: 'Impl' },
      { name: 'WithLibraryImplV1', alias: 'WithLibraryImpl' },
    ];
    await add({ contractsData, packageFile: this.packageFile });
    await push({ network, txParams, networkFile: this.networkFile });

    this.implV1Address = this.networkFile.contract('Impl').address;
    this.withLibraryImplV1Address = this.networkFile.contract(
      'WithLibraryImpl',
    ).address;

    this.proxy1 = await createProxy({
      contractAlias: 'Impl',
      network,
      txParams,
      networkFile: this.networkFile,
    });
    this.proxy2 = await createProxy({
      contractAlias: 'Impl',
      network,
      txParams,
      networkFile: this.networkFile,
    });
    this.proxy3 = await createProxy({
      contractAlias: 'WithLibraryImpl',
      network,
      txParams,
      networkFile: this.networkFile,
    });
  };

  const bumpVersion = async function() {
    await bump({ version: version_2, txParams, packageFile: this.packageFile });
    const newContractsData = [
      { name: 'ImplV2', alias: 'Impl' },
      { name: 'WithLibraryImplV2', alias: 'WithLibraryImpl' },
    ];
    await add({
      contractsData: newContractsData,
      packageFile: this.packageFile,
    });
    await push({ network, txParams, networkFile: this.networkFile });

    this.implV2Address = this.networkFile.contract('Impl').address;
    this.withLibraryImplV2Address = this.networkFile.contract(
      'WithLibraryImpl',
    ).address;
  };

  const shouldHandleUpdateScript = function() {
    describe('updating', function() {
      beforeEach('setup', async function() {
        await createProxies.call(this);
        await bumpVersion.call(this);
      });

      it('should upgrade the version of a proxy given its address', async function() {
        // Upgrade single proxy
        const proxyAddress = this.networkFile.getProxies({
          contract: 'Impl',
        })[0].address;
        await update({
          contractAlias: 'Impl',
          proxyAddress,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 0, {
          version: version_2,
          implementation: this.implV2Address,
          address: proxyAddress,
        });

        // Check other proxies were unmodified
        await assertProxyInfo(this.networkFile, 'Impl', 1, {
          version: version_1,
          implementation: this.implV1Address,
        });
        await assertProxyInfo(this.networkFile, 'WithLibraryImpl', 0, {
          version: version_1,
          implementation: this.withLibraryImplV1Address,
        });
      });

      it('should upgrade the version of all proxies given the contract alias', async function() {
        // Upgrade all 'Impl' proxies
        await update({
          contractAlias: 'Impl',
          proxyAddress: undefined,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 0, {
          version: version_2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 1, {
          version: version_2,
          implementation: this.implV2Address,
        });

        // Keep WithLibraryImpl unmodified
        await assertProxyInfo(this.networkFile, 'WithLibraryImpl', 0, {
          version: version_1,
          implementation: this.withLibraryImplV1Address,
        });
      });

      it('should upgrade the version of all proxies in the app', async function() {
        this.networkFile.updateProxy(
          { contract: 'Impl', package: 'Herbs', address: this.proxy1.address },
          proxy => omit(proxy, 'kind'),
        ); // remove proxy.kind to check it properly defaults to Upgradeable
        await update({
          contractAlias: undefined,
          proxyAddress: undefined,
          all: true,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 0, {
          version: version_2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 1, {
          version: version_2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'WithLibraryImpl', 0, {
          version: version_2,
          implementation: this.withLibraryImplV2Address,
        });
      });

      it('should not attempt to upgrade a proxy not owned', async function() {
        const proxyAddress = this.networkFile.getProxies({
          contract: 'Impl',
        })[0].address;
        await setAdmin({
          proxyAddress,
          newAdmin: anotherAccount,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await update({
          contractAlias: undefined,
          proxyAddress: undefined,
          all: true,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 0, {
          version: version_1,
          implementation: this.implV1Address,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 1, {
          version: version_2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'WithLibraryImpl', 0, {
          version: version_2,
          implementation: this.withLibraryImplV2Address,
        });
      });

      it('should upgrade the remaining proxies if one was already upgraded', async function() {
        // Upgrade a single proxy
        const proxyAddress = this.networkFile.getProxies({
          contract: 'Impl',
        })[0].address;
        await update({
          contractAlias: 'Impl',
          proxyAddress,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 0, {
          version: version_2,
          implementation: this.implV2Address,
          address: proxyAddress,
        });

        // Upgrade all
        await update({
          contractAlias: undefined,
          proxyAddress: undefined,
          all: true,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 1, {
          version: version_2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'WithLibraryImpl', 0, {
          version: version_2,
          implementation: this.withLibraryImplV2Address,
        });
      });

      it('should upgrade a single proxy and migrate it', async function() {
        const proxyAddress = this.networkFile.getProxies({
          contract: 'Impl',
        })[0].address;
        await update({
          contractAlias: 'Impl',
          methodName: 'migrate',
          methodArgs: [42],
          proxyAddress,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 0, {
          version: version_2,
          implementation: this.implV2Address,
          address: proxyAddress,
          value: 42,
        });
      });

      it('should upgrade multiple proxies and migrate them', async function() {
        await update({
          contractAlias: 'Impl',
          methodName: 'migrate',
          methodArgs: [42],
          proxyAddress: undefined,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 0, {
          version: version_2,
          implementation: this.implV2Address,
          value: 42,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 1, {
          version: version_2,
          implementation: this.implV2Address,
          value: 42,
        });
      });

      it('should upgrade multiple proxies and migrate them', async function() {
        // add non-migratable implementation for WithLibraryImpl contract
        await add({
          contractsData: [
            { name: 'UnmigratableImplV2', alias: 'WithLibraryImpl' },
          ],
          packageFile: this.packageFile,
        });
        await push({ network, txParams, networkFile: this.networkFile });

        await update({
          contractAlias: undefined,
          proxyAddress: undefined,
          all: true,
          methodName: 'migrate',
          methodArgs: [42],
          network,
          txParams,
          networkFile: this.networkFile,
        }).should.be.rejectedWith(/failed to upgrade/);

        await assertProxyInfo(this.networkFile, 'Impl', 0, {
          version: version_2,
          implementation: this.implV2Address,
          value: 42,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 1, {
          version: version_2,
          implementation: this.implV2Address,
          value: 42,
        });
        await assertProxyInfo(this.networkFile, 'WithLibraryImpl', 0, {
          version: version_1,
          implementation: this.withLibraryImplV1Address,
        });
      });

      it('should refuse to upgrade a proxy to an undeployed contract', async function() {
        const contracts = this.networkFile.contracts;
        delete contracts['Impl'];
        this.networkFile.contracts = contracts;

        await update({
          contractAlias: 'Impl',
          proxyAddress: null,
          network,
          txParams,
          networkFile: this.networkFile,
        }).should.be.rejectedWith('Contracts Impl are not deployed.');
      });

      describe('with local modifications', function() {
        beforeEach(
          'changing local network file to have a different bytecode',
          async function() {
            const contracts = this.networkFile.contracts;
            contracts['Impl'].localBytecodeHash = '0xabcd';
            this.networkFile.contracts = contracts;
          },
        );

        it('should refuse to upgrade a proxy for a modified contract', async function() {
          await update({
            contractAlias: 'Impl',
            network,
            txParams,
            networkFile: this.networkFile,
          }).should.be.rejectedWith(
            'Contracts Impl have changed since the last deploy.',
          );
        });

        it('should upgrade a proxy for a modified contract if force is set', async function() {
          await update({
            contractAlias: 'Impl',
            network,
            txParams,
            force: true,
            networkFile: this.networkFile,
          });
          await assertProxyInfo(this.networkFile, 'Impl', 0, {
            version: version_2,
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
            contractAlias: 'Impl',
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
            contractsData: [{ name: 'WithLibraryImplV1', alias: 'NoMigrate' }],
            packageFile: this.packageFile,
          });
          await push({ network, txParams, networkFile: this.networkFile });

          await update({
            contractAlias: 'NoMigrate',
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
          contractAlias: 'Impl',
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await bumpVersion.call(this);
      });

      it('should not attempt to upgrade a minimal proxy', async function() {
        await update({
          contractAlias: undefined,
          proxyAddress: undefined,
          all: true,
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 0, {
          version: version_2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 1, {
          version: version_2,
          implementation: this.implV2Address,
        });
        await assertProxyInfo(this.networkFile, 'Impl', 2, {
          version: version_1,
          implementation: this.implV1Address,
          minimal: true,
        });
        await assertProxyInfo(this.networkFile, 'WithLibraryImpl', 0, {
          version: version_2,
          implementation: this.withLibraryImplV2Address,
        });
      });
    });
  };

  const shouldHandleUpdateOnDependency = function() {
    describe('updating on dependency', function() {
      beforeEach('setup', async function() {
        this.networkFile = this.packageFile.networkFile(network);

        await push({
          network,
          txParams,
          deployDependencies: true,
          networkFile: this.networkFile,
        });
        await createProxy({
          packageName: 'mock-stdlib-undeployed',
          contractAlias: 'Greeter',
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await createProxy({
          packageName: 'mock-stdlib-undeployed',
          contractAlias: 'Greeter',
          network,
          txParams,
          networkFile: this.networkFile,
        });

        await bump({
          version: version_2,
          txParams,
          packageFile: this.packageFile,
        });
        await link({
          txParams,
          dependencies: ['mock-stdlib-undeployed-2@1.2.0'],
          packageFile: this.packageFile,
        });
        await push({
          network,
          txParams,
          deployDependencies: true,
          networkFile: this.networkFile,
        });

        // We modify the proxies' package to v2, so we can upgrade them, simulating an upgrade to mock-stdlib-undeployed
        this.networkFile.data.proxies = mapKeys(
          this.networkFile.data.proxies,
          (value, key) =>
            key.replace('mock-stdlib-undeployed', 'mock-stdlib-undeployed-2'),
        );
      });

      it('should upgrade the version of a proxy given its address', async function() {
        const proxyAddress = this.networkFile.getProxies({
          contract: 'Greeter',
        })[0].address;
        await update({
          proxyAddress,
          network,
          txParams,
          networkFile: this.networkFile,
        });

        await assertProxyInfo(this.networkFile, 'Greeter', 0, {
          version: '1.2.0',
          address: proxyAddress,
        });
        const upgradedProxy = Greeter_V2.at(proxyAddress);
        (await upgradedProxy.methods.version().call()).should.eq('1.2.0');

        const anotherProxyAddress = this.networkFile.getProxies({
          contract: 'Greeter',
        })[1].address;
        const notUpgradedProxy = Greeter_V1.at(anotherProxyAddress);
        (await notUpgradedProxy.methods.version().call()).should.eq('1.1.0');
      });

      it('should upgrade the version of all proxies given their name', async function() {
        await update({
          packageName: 'mock-stdlib-undeployed-2',
          contractAlias: 'Greeter',
          network,
          txParams,
          networkFile: this.networkFile,
        });

        const { address: proxyAddress } = await assertProxyInfo(
          this.networkFile,
          'Greeter',
          0,
          { version: '1.2.0' },
        );
        (await Greeter_V2.at(proxyAddress)
          .methods.version()
          .call()).should.eq('1.2.0');
        const { address: anotherProxyAddress } = await assertProxyInfo(
          this.networkFile,
          'Greeter',
          0,
          { version: '1.2.0' },
        );
        (await Greeter_V2.at(anotherProxyAddress)
          .methods.version()
          .call()).should.eq('1.2.0');
      });

      it('should upgrade the version of all proxies given their package', async function() {
        await update({
          packageName: 'mock-stdlib-undeployed-2',
          network,
          txParams,
          networkFile: this.networkFile,
        });

        const { address: proxyAddress } = await assertProxyInfo(
          this.networkFile,
          'Greeter',
          0,
          { version: '1.2.0' },
        );
        (await Greeter_V2.at(proxyAddress)
          .methods.version()
          .call()).should.eq('1.2.0');
        const { address: anotherProxyAddress } = await assertProxyInfo(
          this.networkFile,
          'Greeter',
          0,
          { version: '1.2.0' },
        );
        (await Greeter_V2.at(anotherProxyAddress)
          .methods.version()
          .call()).should.eq('1.2.0');
      });

      it('should upgrade the version of all proxies', async function() {
        await update({
          network,
          txParams,
          all: true,
          networkFile: this.networkFile,
        });

        const { address: proxyAddress } = await assertProxyInfo(
          this.networkFile,
          'Greeter',
          0,
          { version: '1.2.0' },
        );
        (await Greeter_V2.at(proxyAddress)
          .methods.version()
          .call()).should.eq('1.2.0');
        const { address: anotherProxyAddress } = await assertProxyInfo(
          this.networkFile,
          'Greeter',
          0,
          { version: '1.2.0' },
        );
        (await Greeter_V2.at(anotherProxyAddress)
          .methods.version()
          .call()).should.eq('1.2.0');
      });
    });
  };

  describe('on application contract', function() {
    beforeEach('setup package', async function() {
      this.packageFile = new ZosPackageFile(
        'test/mocks/packages/package-empty.zos.json',
      );
      this.packageFile.version = version_1;
    });

    shouldHandleUpdateScript();
    shouldHandleUpdateWithMinimalProxies();
  });

  describe('on application contract in unpublished mode', function() {
    beforeEach('setup package', async function() {
      this.packageFile = new ZosPackageFile(
        'test/mocks/packages/package-empty.zos.json',
      );
      this.packageFile.publish = false;
      this.packageFile.version = version_1;
    });

    shouldHandleUpdateScript();
    shouldHandleUpdateWithMinimalProxies();
  });

  describe('on dependency contract', function() {
    beforeEach('setup package', async function() {
      this.packageFile = new ZosPackageFile(
        'test/mocks/packages/package-with-undeployed-stdlib.zos.json',
      );
      this.packageFile.version = version_1;
    });

    shouldHandleUpdateOnDependency();
  });

  describe('on dependency contract in unpublished mode', function() {
    beforeEach('setup package', async function() {
      this.packageFile = new ZosPackageFile(
        'test/mocks/packages/package-with-undeployed-stdlib.zos.json',
      );
      this.packageFile.publish = false;
      this.packageFile.version = version_1;
    });

    shouldHandleUpdateOnDependency();
  });
});
