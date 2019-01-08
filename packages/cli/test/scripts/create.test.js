'use strict'
require('../setup')

import CaptureLogs from '../helpers/captureLogs';
import { Contracts, Logger } from 'zos-lib';

import add from '../../src/scripts/add';
import push from '../../src/scripts/push';
import createProxy from '../../src/scripts/create';
import link from '../../src/scripts/link';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";

const ImplV1 = Contracts.getFromLocal('ImplV1');

contract('create script', function([_, owner]) {
  const contractName = 'ImplV1';
  const contractAlias = 'Impl';
  const anotherContractName = 'WithLibraryImplV1';
  const anotherContractAlias = 'WithLibraryImpl';
  const uninitializableContractName = 'UninitializableImplV1';
  const uninitializableContractAlias = 'UninitializableImpl';
  const contractsData = [
    { name: contractName, alias: contractAlias },
    { name: anotherContractName, alias: anotherContractAlias },
    { name: uninitializableContractName, alias: uninitializableContractAlias }
  ];

  const network = 'test';
  const version = '0.4.0';
  const txParams = { from: owner };

  const assertProxy = async function(networkFile, alias, { version, say, implementation, packageName, value }) {
    const proxyInfo = networkFile.getProxies({ contract: alias })[0]
    proxyInfo.contract.should.eq(alias)
    proxyInfo.address.should.be.nonzeroAddress;
    proxyInfo.version.should.eq(version);

    if (say) {
      const proxy = await ImplV1.at(proxyInfo.address);
      const said = await proxy.say();
      said.should.eq(say);
    }

    if (value) {
      const proxy = await ImplV1.at(proxyInfo.address);
      const actualValue = await proxy.value();
      actualValue.toNumber().should.eq(value);
    }

    if (implementation) {
      proxyInfo.implementation.should.eq(implementation);
    }

    if (packageName) {
      proxyInfo.package.should.eq(packageName)
    }
  }

  const shouldHandleCreateScript = function() {
    beforeEach('setup', async function() {
      this.networkFile = this.packageFile.networkFile(network)

      await add({ contractsData, packageFile: this.packageFile });
      await push({ network, txParams, networkFile: this.networkFile });
    });

    it('should create a proxy for one of its contracts', async function() {
      await createProxy({ contractAlias, network, txParams, networkFile: this.networkFile });

      const implementation = this.networkFile.contract(contractAlias).address;
      await assertProxy(this.networkFile, contractAlias, { version, say: 'V1', implementation });
    });

    it('should create a proxy for one of its contracts with explicit package name', async function() {
      await createProxy({ packageName: 'Herbs', contractAlias, network, txParams, networkFile: this.networkFile });

      const implementation = this.networkFile.contract(contractAlias).address;
      await assertProxy(this.networkFile, contractAlias, { version, say: 'V1', implementation });
    });

    // TODO: for some reason this test fails on travis
    xit('should record the proxy deployed address in contract build json file', async function () {
      await createProxy({ contractAlias, network, txParams, networkFile: this.networkFile });

      const networks = Object.values(Contracts.getFromLocal(contractName).networks)
      const proxyAddress = this.networkFile.proxy(contractAlias, 0).implementation
      networks.filter(network => network.address === proxyAddress).should.be.have.lengthOf(1)
    });

    it('should refuse to create a proxy for an undefined contract', async function() {
      await createProxy({ contractAlias: 'NotExists', network, txParams, networkFile: this.networkFile })
        .should.be.rejectedWith(/Contract NotExists not found/);
    });

    it('should refuse to create a proxy for an undeployed contract', async function() {
      const customContractsData = [{ name: contractName, alias: 'NotDeployed' }]
      await add({ contractsData: customContractsData, packageFile: this.packageFile });

      await createProxy({ contractAlias: 'NotDeployed', network, txParams, networkFile: this.networkFile })
        .should.be.rejectedWith('Contract NotDeployed is not deployed to test.');
    });

    it('should be able to have multiple proxies for one of its contracts', async function() {
      await createProxy({ contractAlias, network, txParams, networkFile: this.networkFile });
      await createProxy({ contractAlias, network, txParams, networkFile: this.networkFile });
      await createProxy({ contractAlias, network, txParams, networkFile: this.networkFile });

      this.networkFile.getProxies({ contract: contractAlias }).should.have.lengthOf(3);
    });

    it('should be able to handle proxies for more than one contract', async function() {
      await createProxy({ contractAlias, network, txParams, networkFile: this.networkFile });
      await createProxy({ contractAlias: anotherContractAlias, network, txParams, networkFile: this.networkFile });

      await assertProxy(this.networkFile, contractAlias, { version, say: 'V1' });
      await assertProxy(this.networkFile, anotherContractAlias, { version, say: 'WithLibraryV1' });
    });

    it('should initialize a proxy using scientific notation', async function() {
      const proxy = await createProxy({ contractAlias, network, txParams, initMethod: 'initialize', initArgs: ["20e10"], networkFile: this.networkFile });
      (await proxy.value()).toString().should.be.eq('200000000000');
    });

    it('should initialize a proxy using large number on scientific notation', async function() {
      const proxy = await createProxy({ contractAlias, network, txParams, initMethod: 'initialize', initArgs: ["20e70"], networkFile: this.networkFile });
      (await proxy.value()).toString().should.be.eq('2e+71');
    });

    describe('warnings', function () {
      beforeEach('capturing log output', function () {
        this.logs = new CaptureLogs();
      });

      afterEach(function () {
        this.logs.restore();
      });

      it('should warn when not initializing a contract with initialize method', async function() {
        await createProxy({ contractAlias, network, txParams, networkFile: this.networkFile });

        this.logs.errors.should.have.lengthOf(1);
        this.logs.errors[0].should.match(/make sure you initialize/i);
      });

      it('should warn when not initializing a contract that inherits from one with an initialize method', async function() {
        await createProxy({ contractAlias: anotherContractAlias, network, txParams, networkFile: this.networkFile });

        this.logs.errors.should.have.lengthOf(1);
        this.logs.errors[0].should.match(/make sure you initialize/i);
      });

      it('should not warn when initializing a contract', async function() {
        await createProxy({ contractAlias, network, txParams, initMethod: 'initialize', initArgs: [42], networkFile: this.networkFile });

        this.logs.errors.should.have.lengthOf(0);
      });

      it('should not warn when a contract has not initialize method', async function() {
        await createProxy({ contractAlias: uninitializableContractAlias, network, txParams, networkFile: this.networkFile });

        this.logs.errors.should.have.lengthOf(0);
      });
    });

    describe('with dependency', function () {
      const dependencyVersion = '1.1.0';

      beforeEach('setting dependency', async function () {
        await link({ dependencies: ['mock-stdlib-undeployed@1.1.0'], packageFile: this.packageFile });
        await push({ network, txParams, deployDependencies: true, networkFile: this.networkFile });
      });

      it('should fail to create a proxy from a dependency without specifying package name', async function () {
        await createProxy({ contractAlias: 'Greeter', network, txParams, networkFile: this.networkFile })
          .should.be.rejectedWith(/not found/)
      });

      it('should create a proxy from a dependency', async function () {
        await createProxy({ packageName: 'mock-stdlib-undeployed', contractAlias: 'Greeter', network, txParams, networkFile: this.networkFile });
        await assertProxy(this.networkFile, 'Greeter', { version: dependencyVersion, packageName: 'mock-stdlib-undeployed' });
      });

      it('should initialize a proxy from a dependency', async function () {
        await createProxy({ packageName: 'mock-stdlib-undeployed', contractAlias: 'Greeter', network, txParams, networkFile: this.networkFile, initMethod: 'initialize', initArgs: ["42"] });
        await assertProxy(this.networkFile, 'Greeter', { version: dependencyVersion, packageName: 'mock-stdlib-undeployed', value: 42 });
      });

      it('should initialize a proxy from a dependency using explicit function', async function () {
        await createProxy({ packageName: 'mock-stdlib-undeployed', contractAlias: 'Greeter', network, txParams, networkFile: this.networkFile, initMethod: 'clashingInitialize(uint256)', initArgs: ["42"] });
        await assertProxy(this.networkFile, 'Greeter', { version: dependencyVersion, packageName: 'mock-stdlib-undeployed', value: 42 });
      });
    });

    describe('with unlinked dependency', function () {
      beforeEach('setting dependency', async function () {
        await link({ dependencies: ['mock-stdlib@1.1.0'], packageFile: this.packageFile });
      });

      it('should refuse create a proxy for unlinked dependency', async function () {
        await createProxy({ packageName: 'mock-stdlib', contractAlias: 'Greeter', network, txParams, networkFile: this.networkFile })
          .should.be.rejectedWith(/Dependency mock-stdlib has not been linked yet/)
      });
    });

    it('should refuse to create a proxy for an undefined contract', async function() {
      await createProxy({ contractAlias: 'NotExists', network, txParams, networkFile: this.networkFile })
        .should.be.rejectedWith(/Contract NotExists not found/);
    });

    it('should refuse to create a proxy for an undefined dependency', async function() {
      await createProxy({ packageName: 'NotExists', contractAlias, network, txParams, networkFile: this.networkFile })
        .should.be.rejectedWith(/Dependency NotExists not found/);
    });

    describe('with local modifications', function () {
      beforeEach('changing local network file to have a different bytecode', async function () {
        this.networkFile.contract(contractAlias).localBytecodeHash = '0xabcd'
      });

      it('should refuse to create a proxy for a modified contract', async function () {
        await createProxy({ contractAlias,network, txParams, networkFile: this.networkFile })
          .should.be.rejectedWith('Contract Impl has changed locally since the last deploy, consider running \'zos push\'.');
      });

      it('should create a proxy for an unmodified contract', async function () {
        await createProxy({ contractAlias: anotherContractAlias, network, txParams, networkFile: this.networkFile });

        await assertProxy(this.networkFile, anotherContractAlias, { version, say: 'WithLibraryV1' });
      });

      it('should create a proxy for a modified contract if force is set', async function () {
        await createProxy({ contractAlias, network, txParams, force: true, networkFile: this.networkFile });

        await assertProxy(this.networkFile, contractAlias, { version, say: 'V1' });
      });
    });
  }
  
  describe('on unpublished project', function () {
    beforeEach('setup', async function() {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
      this.packageFile.version = version
      this.packageFile.publish = false
    });

    shouldHandleCreateScript();
  })

  describe('on published project', function () {
    beforeEach('setup', async function() {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
      this.packageFile.version = version
    });

    shouldHandleCreateScript();
  })
  
});
