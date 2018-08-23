'use strict'
require('../setup')

import { Contracts } from "zos-lib";
import CaptureLogs from '../helpers/captureLogs';

import add from '../../src/scripts/add.js';
import push from '../../src/scripts/push.js';
import bumpVersion from '../../src/scripts/bump.js';
import createProxy from '../../src/scripts/create.js';
import update from '../../src/scripts/update.js';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";

const ImplV1 = Contracts.getFromLocal('ImplV1')
const ImplV2 = Contracts.getFromLocal('ImplV2')
const PackagedApp = Contracts.getFromLib('PackagedApp')
const Greeter_V1 = Contracts.getFromNodeModules('mock-stdlib', 'GreeterImpl')
const Greeter_V2 = Contracts.getFromNodeModules('mock-stdlib-2', 'GreeterImpl')

contract('update script', function([_, owner]) {
  const network = 'test';
  const version_1 = '1.1.0';
  const version_2 = '1.2.0';
  const txParams = { from: owner };

  const assertProxyInfo = async function(networkFile, contractAlias, proxyIndex, { version, implementation, address, value }) {
    const proxyInfo = networkFile.getProxies({ contract: contractAlias })[proxyIndex]
    if (address) proxyInfo.address.should.eq(address);
    else proxyInfo.address.should.be.nonzeroAddress;

    if (implementation) {
      const app = PackagedApp.at(networkFile.appAddress)
      const actualImplementation = await app.getProxyImplementation(proxyInfo.address)
      actualImplementation.should.eq(implementation);
      proxyInfo.implementation.should.eq(implementation);
    }

    if (version) proxyInfo.version.should.eq(version);
    
    if (value) {
      const proxy = ImplV1.at(proxyInfo.address);
      const actualValue = await proxy.value();
      actualValue.toNumber().should.eq(value);
    }

    return proxyInfo;
  };

  describe('on application contract', function () {

    beforeEach('setup', async function() {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
      this.networkFile = this.packageFile.networkFile(network)

      const contractsData = [{ name: 'ImplV1', alias: 'Impl' }, { name: 'AnotherImplV1', alias: 'AnotherImpl' }]
      await add({ contractsData, packageFile: this.packageFile });
      await push({ network, txParams, networkFile: this.networkFile });

      this.implV1Address = this.networkFile.contract('Impl').address;
      this.anotherImplV1Address = this.networkFile.contract('AnotherImpl').address;

      await createProxy({ contractAlias: 'Impl', network, txParams, networkFile: this.networkFile });
      await createProxy({ contractAlias: 'Impl', network, txParams, networkFile: this.networkFile });
      await createProxy({ contractAlias: 'AnotherImpl', network, txParams, networkFile: this.networkFile });

      await bumpVersion({ version: version_2, txParams, packageFile: this.packageFile });
      const newContractsData = [{ name: 'ImplV2', alias: 'Impl' }, { name: 'AnotherImplV2', alias: 'AnotherImpl' }]
      await add({ contractsData: newContractsData, packageFile: this.packageFile });
      await push({ network, txParams, networkFile: this.networkFile });

      this.implV2Address = this.networkFile.contract('Impl').address;
      this.anotherImplV2Address = this.networkFile.contract('AnotherImpl').address;
    });

    it('should upgrade the version of a proxy given its address', async function() {
      // Upgrade single proxy
      const proxyAddress = this.networkFile.getProxies({ contract: 'Impl'})[0].address;
      await update({ contractAlias: 'Impl', proxyAddress, network, txParams, networkFile: this.networkFile });
      await assertProxyInfo(this.networkFile, 'Impl', 0, { version: version_2, implementation: this.implV2Address, address: proxyAddress });

      // Check other proxies were unmodified
      await assertProxyInfo(this.networkFile, 'Impl', 1, { version: version_1, implementation: this.implV1Address });
      await assertProxyInfo(this.networkFile, 'AnotherImpl', 0, { version: version_1, implementation: this.anotherImplV1Address });
    });

    it('should upgrade the version of all proxies given the contract alias', async function() {
      // Upgrade all 'Impl' proxies
      await update({ contractAlias: 'Impl', proxyAddress: undefined, network, txParams, networkFile: this.networkFile });
      await assertProxyInfo(this.networkFile, 'Impl', 0, { version: version_2, implementation: this.implV2Address });
      await assertProxyInfo(this.networkFile, 'Impl', 1, { version: version_2, implementation: this.implV2Address });

      // Keep AnotherImpl unmodified
      await assertProxyInfo(this.networkFile, 'AnotherImpl', 0, { version: version_1, implementation: this.anotherImplV1Address });
    });

    it('should upgrade the version of all proxies in the app', async function() {
      await update({ contractAlias: undefined, proxyAddress: undefined, all: true, network, txParams, networkFile: this.networkFile });
      await assertProxyInfo(this.networkFile, 'Impl', 0, { version: version_2, implementation: this.implV2Address });
      await assertProxyInfo(this.networkFile, 'Impl', 1, { version: version_2, implementation: this.implV2Address });
      await assertProxyInfo(this.networkFile, 'AnotherImpl', 0, { version: version_2, implementation: this.anotherImplV2Address });
    });

    it('should require all flag to upgrade all proxies', async function() {
      await update(
        { contractAlias: undefined, proxyAddress: undefined, all: false, network, txParams, networkFile: this.networkFile }
      ).should.be.rejected;
    });

    it('should upgrade the remaining proxies if one was already upgraded', async function() {
      // Upgrade a single proxy
      const proxyAddress = this.networkFile.getProxies({ contract: 'Impl'})[0].address;
      await update({ contractAlias: 'Impl', proxyAddress, network, txParams, networkFile: this.networkFile });
      await assertProxyInfo(this.networkFile, 'Impl', 0, { version: version_2, implementation: this.implV2Address, address: proxyAddress });

      // Upgrade all
      await update({ contractAlias: undefined, proxyAddress: undefined, all: true, network, txParams, networkFile: this.networkFile });
      await assertProxyInfo(this.networkFile, 'Impl', 1, { version: version_2, implementation: this.implV2Address });
      await assertProxyInfo(this.networkFile, 'AnotherImpl', 0, { version: version_2, implementation: this.anotherImplV2Address });
    });

    it('should upgrade a single proxy and migrate it', async function() {
      const proxyAddress = this.networkFile.getProxies({ contract: 'Impl'})[0].address;
      await update({ contractAlias: 'Impl', initMethod: 'migrate', initArgs: [42], proxyAddress, network, txParams, networkFile: this.networkFile });
      await assertProxyInfo(this.networkFile, 'Impl', 0, { version: version_2, implementation: this.implV2Address, address: proxyAddress, value: 42 });
    });

    it('should upgrade multiple proxies and migrate them', async function() {
      await update({ contractAlias: 'Impl', initMethod: 'migrate', initArgs: [42], proxyAddress: undefined, network, txParams, networkFile: this.networkFile });
      await assertProxyInfo(this.networkFile, 'Impl', 0, { version: version_2, implementation: this.implV2Address, value: 42 });
      await assertProxyInfo(this.networkFile, 'Impl', 1, { version: version_2, implementation: this.implV2Address, value: 42 });
    });

    it('should upgrade multiple proxies and migrate them', async function() {
      // add non-migratable implementation for AnotherImpl contract
      await add({ contractsData: [{ name: 'UnmigratableImplV2', alias: 'AnotherImpl' }], packageFile: this.packageFile })
      await push({ network, txParams, networkFile: this.networkFile });

      await update({ contractAlias: undefined, proxyAddress: undefined, all: true, initMethod: "migrate", initArgs: [42], network, txParams, networkFile: this.networkFile })
        .should.be.rejectedWith(/failed to update/);

      await assertProxyInfo(this.networkFile, 'Impl', 0, { version: version_2, implementation: this.implV2Address, value: 42 });
      await assertProxyInfo(this.networkFile, 'Impl', 1, { version: version_2, implementation: this.implV2Address, value: 42 });
      await assertProxyInfo(this.networkFile, 'AnotherImpl', 0, { version: version_1, implementation: this.anotherImplV1Address });
    });

    it('should refuse to upgrade a proxy to an undeployed contract', async function() {
      const contracts = this.networkFile.contracts
      delete contracts['Impl'];
      this.networkFile.contracts = contracts

      await update({ contractAlias: 'Impl', proxyAddress: null, network, txParams, networkFile: this.networkFile })
        .should.be.rejectedWith('Contracts Impl are not deployed.')
    });

    describe('with local modifications', function () {
      beforeEach('changing local network file to have a different bytecode', async function () {
        const contracts = this.networkFile.contracts
        contracts['Impl'].bytecodeHash = '0xabcd';
        this.networkFile.contracts = contracts
      });

      it('should refuse to upgrade a proxy for a modified contract', async function () {
        await update({ contractAlias: 'Impl', network, txParams, networkFile: this.networkFile })
          .should.be.rejectedWith('Contracts Impl have changed since the last deploy.');
      });

      it('should upgrade a proxy for a modified contract if force is set', async function () {
        await update({ contractAlias: 'Impl', network, txParams, force: true, networkFile: this.networkFile });
        await assertProxyInfo(this.networkFile, 'Impl', 0, { version: version_2, implementation: this.implV2Address })
      });
    });

    describe('warnings', function () {
      beforeEach('capturing log output', function () {
        this.logs = new CaptureLogs();
      });
  
      afterEach(function () {
        this.logs.restore();
      });
  
      it('should warn when not migrating a contract with migrate method', async function() {
        await update({ contractAlias: 'Impl', network, txParams, networkFile: this.networkFile });
        this.logs.errors.should.have.lengthOf(1);
        this.logs.errors[0].should.match(/remember running the migration/i);
      });
  
      it('should warn when not migrating a contract that inherits from one with a migrate method', async function() {
        await update({ contractAlias: 'AnotherImpl', network, txParams, networkFile: this.networkFile });
        this.logs.errors.should.have.lengthOf(1);
        this.logs.errors[0].should.match(/remember running the migration/i);
      });
  
      it('should not warn when migrating a contract', async function() {
        await update({ contractAlias: 'Impl', network, txParams, initMethod: 'migrate', initArgs: [42], networkFile: this.networkFile });
        this.logs.errors.should.have.lengthOf(0);
      });
  
      it('should not warn when a contract has no migrate method', async function() {
        await add({ contractsData: [{ name: 'AnotherImplV1', alias: 'NoMigrate' }], packageFile: this.packageFile });
        await push({ network, txParams, networkFile: this.networkFile });

        await update({ contractAlias: 'NoMigrate', network, txParams, networkFile: this.networkFile });
        this.logs.errors.should.have.lengthOf(0);
      });
    });
  });

  describe.skip('on stdlib contract', function () {

    beforeEach('setup', async function() {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-stdlib.zos.json')
      this.networkFile = this.packageFile.networkFile(network)

      await push({ network, txParams, deployStdlib: true, networkFile: this.networkFile });
      await createProxy({ contractAlias: 'Greeter', network, txParams, networkFile: this.networkFile });
      await createProxy({ contractAlias: 'Greeter', network, txParams, networkFile: this.networkFile });

      await bumpVersion({ version: version_2, txParams, stdlibNameVersion: 'mock-stdlib-2@1.2.0', packageFile: this.packageFile });
      await push({ network, txParams, deployStdlib: true, networkFile: this.networkFile });
    });

    it('should upgrade the version of a proxy given its address', async function() {
      const proxyAddress = this.networkFile.getProxies({ contract: 'Greeter'})[0].address;
      await update({ contractAlias: 'Greeter', proxyAddress, network, txParams, networkFile: this.networkFile });

      await assertProxyInfo(this.networkFile, 'Greeter', 0, { version: version_2, address: proxyAddress });
      const upgradedProxy = await Greeter_V2.at(proxyAddress);
      (await upgradedProxy.version()).should.eq('1.2.0');

      const anotherProxyAddress = this.networkFile.getProxies({ contract: 'Greeter'})[1].address;
      const notUpgradedProxy = await Greeter_V1.at(anotherProxyAddress);
      (await notUpgradedProxy.version()).should.eq('1.1.0');
    });

    it('should upgrade the version of all proxies given their name', async function() {
      await update({ contractAlias: 'Greeter', network, txParams, networkFile: this.networkFile });

      const { address: proxyAddress } = await assertProxyInfo(this.networkFile, 'Greeter', 0, { version: version_2 });
      (await Greeter_V2.at(proxyAddress).version()).should.eq('1.2.0');
      const { address: anotherProxyAddress } = await assertProxyInfo(this.networkFile, 'Greeter', 0, { version: version_2 });
      (await Greeter_V2.at(anotherProxyAddress).version()).should.eq('1.2.0');
    });

    it('should upgrade the version of all proxies', async function() {
      await update({ network, txParams, all: true, networkFile: this.networkFile });

      const { address: proxyAddress } = await assertProxyInfo(this.networkFile, 'Greeter', 0, { version: version_2 });
      (await Greeter_V2.at(proxyAddress).version()).should.eq('1.2.0');
      const { address: anotherProxyAddress } = await assertProxyInfo(this.networkFile, 'Greeter', 0, { version: version_2 });
      (await Greeter_V2.at(anotherProxyAddress).version()).should.eq('1.2.0');
    });
  });
});
