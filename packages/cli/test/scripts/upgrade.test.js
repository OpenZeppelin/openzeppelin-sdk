'use strict'
require('../setup')

import init from '../../src/scripts/init.js';
import add from '../../src/scripts/add.js';
import push from '../../src/scripts/push.js';
import bumpVersion from '../../src/scripts/bump.js';
import createProxy from '../../src/scripts/create.js';
import upgradeProxy from '../../src/scripts/upgrade.js';
import { Contracts, FileSystem as fs, Logger } from 'zos-lib';
import { cleanupfn } from '../helpers/cleanup.js';
import CaptureLogs from '../helpers/captureLogs';

const ImplV1 = artifacts.require('ImplV1');
const ImplV2 = artifacts.require('ImplV2');
const Greeter = artifacts.require('GreeterImpl');
const PackagedApp = Contracts.getFromLib('PackagedApp');

contract('upgrade-proxy command', function([_, owner]) {
  const txParams = { from: owner };
  const appName = 'MyApp';
  const v1string = '0.1.0';
  const v2string = '0.2.0';
  const network = 'test';
  const packageFileName = 'test/tmp/zos.json';
  const networkFileName = `test/tmp/zos.${network}.json`;

  beforeEach(cleanupfn(packageFileName));
  beforeEach(cleanupfn(networkFileName));
  after(cleanupfn(packageFileName));
  after(cleanupfn(networkFileName));

  const assertProxyInfo = async function(contractAlias, proxyIndex, { version, implementation, address, value }) {
    const data = fs.parseJson(networkFileName);
    const proxyInfo = data.proxies[contractAlias][proxyIndex];
    
    if (address)  {
      proxyInfo.address.should.eq(address);
    } else {
      proxyInfo.address.should.be.nonzeroAddress;
    }

    if (implementation) {
      const app = PackagedApp.at(data.app.address)
      const actualImplementation = await app.getProxyImplementation(proxyInfo.address)
      actualImplementation.should.eq(implementation);
      proxyInfo.implementation.should.eq(implementation);
    }

    if (version)  {
      proxyInfo.version.should.eq(version);
    }
    
    if (value) {
      const proxy = ImplV1.at(proxyInfo.address);
      const actualValue = await proxy.value();
      actualValue.toNumber().should.eq(value);
    }

    return proxyInfo;
  };

  describe('on application contract', function () {

    beforeEach('setup', async function() {
      await init({ name: appName, version: v1string, packageFileName });
      const contractsData = [{ name: 'ImplV1', alias: 'Impl' }, { name: 'AnotherImplV1', alias: 'AnotherImpl' }]
      await add({ contractsData, packageFileName });
      await push({ packageFileName, network, txParams });

      const networkDataV1 = fs.parseJson(networkFileName);
      this.implV1Address = networkDataV1.contracts['Impl'].address;
      this.anotherImplV1Address = networkDataV1.contracts['AnotherImpl'].address;

      await createProxy({ contractAlias: 'Impl', packageFileName, network, txParams });
      await createProxy({ contractAlias: 'Impl', packageFileName, network, txParams });
      await createProxy({ contractAlias: 'AnotherImpl', packageFileName, network, txParams });

      await bumpVersion({ version: v2string, packageFileName, txParams });
      const newContractsData = [{ name: 'ImplV2', alias: 'Impl' }, { name: 'AnotherImplV2', alias: 'AnotherImpl' }]
      await add({ contractsData: newContractsData, packageFileName });
      await push({ packageFileName, network, txParams });

      const networkDataV2 = fs.parseJson(networkFileName);
      this.implV2Address = networkDataV2.contracts['Impl'].address;
      this.anotherImplV2Address = networkDataV2.contracts['AnotherImpl'].address;
    });

    it('should upgrade the version of a proxy given its address', async function() {
      // Upgrade single proxy
      const proxyAddress = fs.parseJson(networkFileName).proxies['Impl'][0].address;
      await upgradeProxy({ contractAlias: 'Impl', proxyAddress, network, packageFileName, txParams });
      await assertProxyInfo('Impl', 0, { version: v2string, implementation: this.implV2Address, address: proxyAddress });

      // Check other proxies were unmodified
      await assertProxyInfo('Impl', 1, { version: v1string, implementation: this.implV1Address });
      await assertProxyInfo('AnotherImpl', 0, { version: v1string, implementation: this.anotherImplV1Address });
    });

    it('should upgrade the version of all proxies given the contract alias', async function() {
      // Upgrade all 'Impl' proxies
      await upgradeProxy({ contractAlias: 'Impl', proxyAddress: undefined, network, packageFileName, txParams });
      await assertProxyInfo('Impl', 0, { version: v2string, implementation: this.implV2Address });
      await assertProxyInfo('Impl', 1, { version: v2string, implementation: this.implV2Address });

      // Keep AnotherImpl unmodified
      await assertProxyInfo('AnotherImpl', 0, { version: v1string, implementation: this.anotherImplV1Address });
    });

    it('should upgrade the version of all proxies in the app', async function() {
      await upgradeProxy({ contractAlias: undefined, proxyAddress: undefined, all: true, network, packageFileName, txParams });
      await assertProxyInfo('Impl', 0, { version: v2string, implementation: this.implV2Address });
      await assertProxyInfo('Impl', 1, { version: v2string, implementation: this.implV2Address });
      await assertProxyInfo('AnotherImpl', 0, { version: v2string, implementation: this.anotherImplV2Address });
    });

    it('should require all flag to upgrade all proxies', async function() {
      await upgradeProxy(
        { contractAlias: undefined, proxyAddress: undefined, all: false, network, packageFileName, txParams }
      ).should.be.rejected;
    });

    it('should upgrade the remaining proxies if one was already upgraded', async function() {
      // Upgrade a single proxy
      const proxyAddress = fs.parseJson(networkFileName).proxies['Impl'][0].address;
      await upgradeProxy({ contractAlias: 'Impl', proxyAddress, network, packageFileName, txParams });
      await assertProxyInfo('Impl', 0, { version: v2string, implementation: this.implV2Address, address: proxyAddress });

      // Upgrade all
      await upgradeProxy({ contractAlias: undefined, proxyAddress: undefined, all: true, network, packageFileName, txParams });
      await assertProxyInfo('Impl', 1, { version: v2string, implementation: this.implV2Address });
      await assertProxyInfo('AnotherImpl', 0, { version: v2string, implementation: this.anotherImplV2Address });
    });

    it('should upgrade a single proxy and migrate it', async function() {
      const proxyAddress = fs.parseJson(networkFileName).proxies['Impl'][0].address;
      await upgradeProxy({ contractAlias: 'Impl', initMethod: 'migrate', initArgs: [42], proxyAddress, network, packageFileName, txParams });
      await assertProxyInfo('Impl', 0, { version: v2string, implementation: this.implV2Address, address: proxyAddress, value: 42 });
    });

    it('should upgrade multiple proxies and migrate them', async function() {
      await upgradeProxy({ contractAlias: 'Impl', initMethod: 'migrate', initArgs: [42], proxyAddress: undefined, network, packageFileName, txParams });
      await assertProxyInfo('Impl', 0, { version: v2string, implementation: this.implV2Address, value: 42 });
      await assertProxyInfo('Impl', 1, { version: v2string, implementation: this.implV2Address, value: 42 });
    });

    it('should refuse to upgrade a proxy to an undeployed contract', async function() {
      const data = fs.parseJson(networkFileName);
      delete data.contracts['Impl'];
      fs.writeJson(networkFileName, data);
      await upgradeProxy({ contractAlias: 'Impl', proxyAddress: null, network, packageFileName, txParams }).should.be.rejectedWith(/Impl are not deployed/)
    });

    describe('with local modifications', function () {
      beforeEach('changing local network file to have a different bytecode', async function () {
        const data = fs.parseJson(networkFileName);
        data.contracts['Impl'].bytecodeHash = '0xabcd';
        fs.writeJson(networkFileName, data);
      });

      it('should refuse to upgrade a proxy for a modified contract', async function () {
        await upgradeProxy({ contractAlias: 'Impl', packageFileName, network, txParams }).should.be.rejectedWith(/Impl have changed/);
      });

      it('should upgrade a proxy for a modified contract if force is set', async function () {
        await upgradeProxy({ contractAlias: 'Impl', packageFileName, network, txParams, force: true });
        await assertProxyInfo('Impl', 0, { version: v2string, implementation: this.implV2Address })
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
        await upgradeProxy({ contractAlias: 'Impl', packageFileName, network, txParams });
        this.logs.errors.should.have.lengthOf(1);
        this.logs.errors[0].should.match(/remember running the migration/i);
      });
  
      it('should warn when not migrating a contract that inherits from one with a migrate method', async function() {
        await upgradeProxy({ contractAlias: 'AnotherImpl', packageFileName, network, txParams });
        this.logs.errors.should.have.lengthOf(1);
        this.logs.errors[0].should.match(/remember running the migration/i);
      });
  
      it('should not warn when migrating a contract', async function() {
        await upgradeProxy({ contractAlias: 'Impl', packageFileName, network, txParams, initMethod: 'migrate', initArgs: [42] });
        this.logs.errors.should.have.lengthOf(0);
      });
  
      it('should not warn when a contract has no migrate method', async function() {
        await add({ contractsData: [{ name: 'AnotherImplV1', alias: 'NoMigrate' }], packageFileName });
        await push({ packageFileName, network, txParams });

        await upgradeProxy({ contractAlias: 'NoMigrate', packageFileName, network, txParams });
        this.logs.errors.should.have.lengthOf(0);
      });
    });
  });

  describe('on stdlib contract', function () {

    beforeEach('setup', async function() {
      await init({ name: appName, version: v1string, packageFileName, stdlibNameVersion: 'mock-stdlib@1.1.0' });
      await push({ packageFileName, network, txParams, deployStdlib: true });

      await createProxy({ contractAlias: 'Greeter', packageFileName, network, txParams });
      await createProxy({ contractAlias: 'Greeter', packageFileName, network, txParams });

      await bumpVersion({ version: v2string, packageFileName, txParams, stdlibNameVersion: 'mock-stdlib-2@1.2.0' });
      await push({ packageFileName, network, txParams, deployStdlib: true });
    });

    it('should upgrade the version of a proxy given its address', async function() {
      const proxyAddress = fs.parseJson(networkFileName).proxies['Greeter'][0].address;
      await upgradeProxy({ contractAlias: 'Greeter', proxyAddress, network, packageFileName, txParams });
      await assertProxyInfo('Greeter', 0, { version: v2string, address: proxyAddress });
      const upgradedProxy = await Greeter.at(proxyAddress);
      (await upgradedProxy.version()).should.eq('1.2.0');

      const anotherProxyAddress = fs.parseJson(networkFileName).proxies['Greeter'][1].address;
      const notUpgradedProxy = await Greeter.at(anotherProxyAddress);
      (await notUpgradedProxy.version()).should.eq('1.1.0');
    });

    it('should upgrade the version of all proxies given their name', async function() {
      await upgradeProxy({ contractAlias: 'Greeter', network, packageFileName, txParams });
      const { address: proxyAddress } = await assertProxyInfo('Greeter', 0, { version: v2string });
      (await Greeter.at(proxyAddress).version()).should.eq('1.2.0');
      const { address: anotherProxyAddress } = await assertProxyInfo('Greeter', 0, { version: v2string });
      (await Greeter.at(anotherProxyAddress).version()).should.eq('1.2.0');
    });

    it('should upgrade the version of all proxies', async function() {
      await upgradeProxy({ network, packageFileName, txParams, all: true });
      const { address: proxyAddress } = await assertProxyInfo('Greeter', 0, { version: v2string });
      (await Greeter.at(proxyAddress).version()).should.eq('1.2.0');
      const { address: anotherProxyAddress } = await assertProxyInfo('Greeter', 0, { version: v2string });
      (await Greeter.at(anotherProxyAddress).version()).should.eq('1.2.0');
    });
  });
});
