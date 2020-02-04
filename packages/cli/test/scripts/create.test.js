'use strict';
require('../setup');

import { random } from 'lodash';
import { accounts } from '@openzeppelin/test-environment';

import CaptureLogs from '../helpers/captureLogs';
import { Contracts, Logger, helpers, Proxy, MinimalProxy, assertRevert } from '@openzeppelin/upgrades';

import add from '../../src/scripts/add';
import push from '../../src/scripts/push';
import create from '../../src/scripts/create';
import queryDeployment from '../../src/scripts/query-deployment';
import link from '../../src/scripts/link';
import ProjectFile from '../../src/models/files/ProjectFile';
import { ProxyType } from '../../src/scripts/interfaces';
import NetworkFile from '../../src/models/files/NetworkFile';

const should = require('chai').should();

const ImplV1 = Contracts.getFromLocal('ImplV1');
const BooleanContract = Contracts.getFromLocal('Boolean');

describe('create script', function() {
  const [owner, otherAdmin] = accounts;

  const contractName = 'ImplV1';
  const contractAlias = 'Impl';
  const anotherContractName = 'WithLibraryImplV1';
  const anotherContractAlias = 'WithLibraryImpl';
  const uninitializableContractName = 'UninitializableImplV1';
  const uninitializableContractAlias = 'UninitializableImpl';
  const booleanContractName = 'Boolean';
  const booleanContractAlias = 'Boolean';
  const contractsData = [
    { name: contractName, alias: contractAlias },
    { name: anotherContractName, alias: anotherContractAlias },
    { name: uninitializableContractName, alias: uninitializableContractAlias },
    { name: booleanContractName, alias: booleanContractAlias },
  ];

  const network = 'test';
  const version = '0.4.0';
  const txParams = { from: owner };

  const assertProxy = async function(
    networkFile,
    alias,
    { version, say, implementation, packageName, value, checkBool, boolValue, admin, address, minimal },
  ) {
    const proxyInfo = networkFile.getProxies({ contract: alias })[0];
    proxyInfo.contract.should.eq(alias);
    proxyInfo.address.should.be.nonzeroAddress;
    proxyInfo.version.should.eq(version);

    if (address) {
      proxyInfo.address.should.equalIgnoreCase(address);
    }

    if (say) {
      const proxy = await ImplV1.at(proxyInfo.address);
      const said = await proxy.methods.say().call();
      said.should.eq(say);
    }

    if (value) {
      const proxy = await ImplV1.at(proxyInfo.address);
      const actualValue = await proxy.methods.value().call();
      actualValue.should.eq(`${value}`);
    }

    if (checkBool) {
      const proxy = await BooleanContract.at(proxyInfo.address);
      const actualValue = await proxy.methods.value().call();
      actualValue.should.eq(boolValue);
    }

    if (implementation) {
      proxyInfo.implementation.should.eq(implementation);
      const proxyImplementation = await Proxy.at(proxyInfo.address).implementation();
      proxyImplementation.should.equalIgnoreCase(implementation);
    }

    if (admin) {
      proxyInfo.admin.should.equalIgnoreCase(admin);
      const proxyAdmin = await Proxy.at(proxyInfo.address).admin();
      proxyAdmin.should.equalIgnoreCase(admin);
    }

    if (packageName) {
      proxyInfo.package.should.eq(packageName);
    }

    if (minimal) {
      proxyInfo.kind.should.eq(ProxyType.Minimal);
      proxyInfo.implementation.should.equalIgnoreCase(minimal);
      const proxyImplementation = await MinimalProxy.at(proxyInfo.address).implementation();
      proxyImplementation.should.equalIgnoreCase(minimal);
    }

    if (!minimal) {
      proxyInfo.admin.should.not.be.undefined;
    }

    return proxyInfo;
  };

  const shouldHandleCreateScript = function() {
    beforeEach('setup', async function() {
      this.networkFile = new NetworkFile(this.projectFile, network);

      await add({ contractsData, projectFile: this.projectFile });
      await push({ network, txParams, networkFile: this.networkFile });
    });

    it('should create a proxy for one of its contracts', async function() {
      await create({
        contractAlias,
        network,
        txParams,
        networkFile: this.networkFile,
      });

      const implementation = this.networkFile.contract(contractAlias).address;
      await assertProxy(this.networkFile, contractAlias, {
        version,
        say: 'V1',
        implementation,
      });
    });

    it('should create a proxy with a different admin', async function() {
      await create({
        contractAlias,
        network,
        txParams,
        networkFile: this.networkFile,
        admin: otherAdmin,
      });

      const implementation = this.networkFile.contract(contractAlias).address;
      await assertProxy(this.networkFile, contractAlias, {
        version,
        say: 'V1',
        implementation,
        admin: otherAdmin,
      });
    });

    it('should create a proxy for one of its contracts with explicit package name', async function() {
      await create({
        packageName: 'Herbs',
        contractAlias,
        network,
        txParams,
        networkFile: this.networkFile,
      });

      const implementation = this.networkFile.contract(contractAlias).address;
      await assertProxy(this.networkFile, contractAlias, {
        version,
        say: 'V1',
        implementation,
      });
    });

    it('should properly initialize a proxy with false boolean values', async function() {
      await create({
        contractAlias: booleanContractAlias,
        network,
        txParams,
        methodName: 'initialize',
        methodArgs: [false],
        networkFile: this.networkFile,
      });

      const implementation = this.networkFile.contract(booleanContractAlias).address;
      await assertProxy(this.networkFile, booleanContractAlias, {
        version,
        checkBool: true,
        boolValue: false,
        implementation,
      });
    });

    it('should properly initialize a proxy with true boolean values', async function() {
      await create({
        contractAlias: booleanContractAlias,
        network,
        txParams,
        methodName: 'initialize',
        methodArgs: [true],
        networkFile: this.networkFile,
      });

      const implementation = this.networkFile.contract(booleanContractAlias).address;
      await assertProxy(this.networkFile, booleanContractAlias, {
        version,
        checkBool: true,
        boolValue: true,
        implementation,
      });
    });

    xit('should record the proxy deployed address in contract build json file', async function() {
      await create({
        contractAlias,
        network,
        txParams,
        networkFile: this.networkFile,
      });

      const networks = Object.values(Contracts.getFromLocal(contractName).networks);
      const proxyAddress = this.networkFile.proxy(contractAlias, 0).implementation;
      networks.filter(network => network.address === proxyAddress).should.be.have.lengthOf(1);
    });

    it('should refuse to create a proxy for an undefined contract', async function() {
      await create({
        contractAlias: 'NotExists',
        network,
        txParams,
        networkFile: this.networkFile,
      }).should.be.rejectedWith(/Contract NotExists not found/);
    });

    it('should refuse to create a proxy for an undeployed contract', async function() {
      const customContractsData = [{ name: contractName, alias: 'NotDeployed' }];
      await add({
        contractsData: customContractsData,
        projectFile: this.projectFile,
      });

      await create({
        contractAlias: 'NotDeployed',
        network,
        txParams,
        networkFile: this.networkFile,
      }).should.be.rejectedWith('Contract NotDeployed is not deployed to test.');
    });

    it('should be able to have multiple proxies for one of its contracts', async function() {
      await create({
        contractAlias,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      await create({
        contractAlias,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      await create({
        contractAlias,
        network,
        txParams,
        networkFile: this.networkFile,
      });

      this.networkFile.getProxies({ contract: contractAlias }).should.have.lengthOf(3);
    });

    it('should be able to handle proxies for more than one contract', async function() {
      await create({
        contractAlias,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      await create({
        contractAlias: anotherContractAlias,
        network,
        txParams,
        networkFile: this.networkFile,
      });

      await assertProxy(this.networkFile, contractAlias, {
        version,
        say: 'V1',
      });
      await assertProxy(this.networkFile, anotherContractAlias, {
        version,
        say: 'WithLibraryV1',
      });
    });

    it('should deploy a proxy admin', async function() {
      await create({
        contractAlias,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      this.networkFile.proxyAdminAddress.should.be.nonzeroAddress;
    });

    it('should store proxy admin if contract creation fails', async function() {
      await assertRevert(
        create({
          contractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
          methodName: 'initializeThatFails',
          methodArgs: [42],
        }),
      );
      should.exist(this.networkFile.proxyAdminAddress);
      this.networkFile.proxyAdminAddress.should.be.nonzeroAddress;
    });

    describe('with salt', function() {
      it('should create a proxy at an address given a salt', async function() {
        const salt = random(0, 2 ** 32);
        await create({
          contractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
          salt,
        });

        const factoryAddress = this.networkFile.proxyFactoryAddress;
        should.exist(factoryAddress, 'Proxy factory was not stored');
        await assertProxy(this.networkFile, contractAlias, {
          version,
          say: 'V1',
        });
      });

      it('should create a proxy at an address given a salt with a different admin', async function() {
        const salt = random(0, 2 ** 32);
        await create({
          contractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
          salt,
          admin: otherAdmin,
        });

        const factoryAddress = this.networkFile.proxyFactoryAddress;
        should.exist(factoryAddress, 'Proxy factory was not stored');
        await assertProxy(this.networkFile, contractAlias, {
          version,
          say: 'V1',
          admin: otherAdmin,
        });
      });

      it('should create a proxy at an address that matches the predicted one', async function() {
        const salt = random(0, 2 ** 32);
        const predictedAddress = await queryDeployment({
          network,
          txParams,
          networkFile: this.networkFile,
          salt,
        });
        const factoryAddress = this.networkFile.proxyFactoryAddress;
        should.exist(factoryAddress, 'Proxy factory was not stored');

        await create({
          contractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
          salt,
        });
        await assertProxy(this.networkFile, contractAlias, {
          version,
          say: 'V1',
          address: predictedAddress,
        });
      });

      it('should create a proxy at an address given a salt and signature', async function() {
        // Get predicted address for a signer different than the owner
        const salt = random(0, 2 ** 32);
        const predictedAddress = await queryDeployment({
          network,
          txParams,
          networkFile: this.networkFile,
          salt,
          sender: helpers.signer,
        });

        // Deploy a proxy to a random contract so we force a proxy admin to be deployed
        await create({
          contractAlias: anotherContractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
        });

        // Create the contract we want with both salt and signature
        const implementation = this.networkFile.contract(contractAlias).address;
        const admin = this.networkFile.proxyAdminAddress;
        const signature = helpers.signDeploy(this.networkFile.proxyFactoryAddress, salt, implementation, admin, '');
        await create({
          contractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
          salt,
          signature,
        });

        // Check the deployment address
        await assertProxy(this.networkFile, contractAlias, {
          version,
          say: 'V1',
          address: predictedAddress,
        });
      });

      it('should create a proxy at an address given a salt and signature with a different admin', async function() {
        const salt = random(0, 2 ** 32);
        const implementation = this.networkFile.contract(contractAlias).address;
        const predictedAddress = await queryDeployment({
          network,
          txParams,
          networkFile: this.networkFile,
          salt,
          sender: helpers.signer,
        });
        const signature = helpers.signDeploy(this.networkFile.proxyFactoryAddress, salt, implementation, otherAdmin);
        await create({
          contractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
          salt,
          signature,
          admin: otherAdmin,
        });
        await assertProxy(this.networkFile, contractAlias, {
          version,
          say: 'V1',
          admin: otherAdmin,
          address: predictedAddress,
        });
      });

      it('should fail if an address is already in use when creating a proxy with a salt', async function() {
        const salt = random(0, 2 ** 32);
        await create({
          contractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
          salt,
        });
        await create({
          contractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
          salt,
        }).should.be.rejectedWith(/Deployment address for salt \d+ is already in use/);
      });
    });

    describe('with minimal proxy', function() {
      it('should create a minimal proxy for one of its contracts', async function() {
        await create({
          kind: ProxyType.Minimal,
          contractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
        });

        const implementation = this.networkFile.contract(contractAlias).address;
        await assertProxy(this.networkFile, contractAlias, {
          version,
          say: 'V1',
          minimal: implementation,
        });
      });

      it('should properly initialize a minimal proxy with true boolean values', async function() {
        await create({
          kind: ProxyType.Minimal,
          contractAlias: booleanContractAlias,
          network,
          txParams,
          methodName: 'initialize',
          methodArgs: [true],
          networkFile: this.networkFile,
        });

        const implementation = this.networkFile.contract(booleanContractAlias).address;
        await assertProxy(this.networkFile, booleanContractAlias, {
          version,
          checkBool: true,
          boolValue: true,
          minimal: implementation,
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

      it('should warn when not initializing a contract with initialize method', async function() {
        await create({
          contractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
        });

        this.logs.warns.should.have.lengthOf(1);
        this.logs.warns[0].should.match(/make sure you initialize/i);
      });

      it('should warn when not initializing a contract that inherits from one with an initialize method', async function() {
        await create({
          contractAlias: anotherContractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
        });

        this.logs.warns.should.have.lengthOf(1);
        this.logs.warns[0].should.match(/make sure you initialize/i);
      });

      it('should not warn when initializing a contract', async function() {
        await create({
          contractAlias,
          network,
          txParams,
          methodName: 'initialize',
          methodArgs: [42],
          networkFile: this.networkFile,
        });

        this.logs.warns.should.have.lengthOf(0);
      });

      it('should not warn when a contract has not initialize method', async function() {
        await create({
          contractAlias: uninitializableContractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
        });

        this.logs.errors.should.have.lengthOf(0);
      });
    });

    describe('with dependency', function() {
      const dependencyVersion = '1.1.0';

      beforeEach('setting dependency', async function() {
        await link({
          dependencies: ['mock-stdlib-undeployed@1.1.0'],
          projectFile: this.projectFile,
        });
        await push({
          network,
          txParams,
          deployDependencies: true,
          networkFile: this.networkFile,
        });
      });

      it('should fail to create a proxy from a dependency without specifying package name', async function() {
        await create({
          contractAlias: 'Greeter',
          network,
          txParams,
          networkFile: this.networkFile,
        }).should.be.rejectedWith(/not found/);
      });

      it('should create a proxy from a dependency', async function() {
        await create({
          packageName: 'mock-stdlib-undeployed',
          contractAlias: 'Greeter',
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await assertProxy(this.networkFile, 'Greeter', {
          version: dependencyVersion,
          packageName: 'mock-stdlib-undeployed',
        });
      });

      it('should initialize a proxy from a dependency', async function() {
        await create({
          packageName: 'mock-stdlib-undeployed',
          contractAlias: 'Greeter',
          network,
          txParams,
          networkFile: this.networkFile,
          methodName: 'initialize',
          methodArgs: ['42'],
        });
        await assertProxy(this.networkFile, 'Greeter', {
          version: dependencyVersion,
          packageName: 'mock-stdlib-undeployed',
          value: 42,
        });
      });

      it('should initialize a proxy from a dependency using explicit function', async function() {
        await create({
          packageName: 'mock-stdlib-undeployed',
          contractAlias: 'Greeter',
          network,
          txParams,
          networkFile: this.networkFile,
          methodName: 'clashingInitialize(uint256)',
          methodArgs: ['42'],
        });
        await assertProxy(this.networkFile, 'Greeter', {
          version: dependencyVersion,
          packageName: 'mock-stdlib-undeployed',
          value: 42,
        });
      });
    });

    describe('with unlinked dependency', function() {
      beforeEach('setting dependency', async function() {
        await link({
          dependencies: ['mock-stdlib@1.1.0'],
          projectFile: this.projectFile,
        });
      });

      it('should refuse create a proxy for unlinked dependency', async function() {
        await create({
          packageName: 'mock-stdlib',
          contractAlias: 'Greeter',
          network,
          txParams,
          networkFile: this.networkFile,
        }).should.be.rejectedWith(/Dependency mock-stdlib has not been linked yet/);
      });
    });

    it('should refuse to create a proxy for an undefined contract', async function() {
      await create({
        contractAlias: 'NotExists',
        network,
        txParams,
        networkFile: this.networkFile,
      }).should.be.rejectedWith(/Contract NotExists not found/);
    });

    it('should refuse to create a proxy for an undefined dependency', async function() {
      await create({
        packageName: 'NotExists',
        contractAlias,
        network,
        txParams,
        networkFile: this.networkFile,
      }).should.be.rejectedWith(/Dependency NotExists not found/);
    });

    describe('with local modifications', function() {
      beforeEach('changing local network file to have a different bytecode', async function() {
        this.networkFile.contract(contractAlias).localBytecodeHash = '0xabcd';
      });

      it('should refuse to create a proxy for a modified contract', async function() {
        await create({
          contractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
        }).should.be.rejectedWith(
          "Contract Impl has changed locally since the last deploy, consider running 'openzeppelin push'.",
        );
      });

      it('should create a proxy for an unmodified contract', async function() {
        await create({
          contractAlias: anotherContractAlias,
          network,
          txParams,
          networkFile: this.networkFile,
        });

        await assertProxy(this.networkFile, anotherContractAlias, {
          version,
          say: 'WithLibraryV1',
        });
      });

      it('should create a proxy for a modified contract if force is set', async function() {
        await create({
          contractAlias,
          network,
          txParams,
          force: true,
          networkFile: this.networkFile,
        });

        await assertProxy(this.networkFile, contractAlias, {
          version,
          say: 'V1',
        });
      });
    });
  };

  describe('on unpublished project', function() {
    beforeEach('setup', async function() {
      this.projectFile = new ProjectFile('test/mocks/packages/package-empty.zos.json');
      this.projectFile.version = version;
      this.projectFile.publish = false;
    });

    shouldHandleCreateScript();
  });

  describe('on published project', function() {
    beforeEach('setup', async function() {
      this.projectFile = new ProjectFile('test/mocks/packages/package-empty.zos.json');
      this.projectFile.version = version;
    });

    shouldHandleCreateScript();
  });
});
