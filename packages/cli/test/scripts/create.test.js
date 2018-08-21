'use strict'
require('../setup')

import CaptureLogs from '../helpers/captureLogs';
import { Contracts, Logger } from 'zos-lib';

import add from '../../src/scripts/add.js';
import push from '../../src/scripts/push.js';
import create from '../../src/scripts/create.js';
import linkStdlib from '../../src/scripts/link.js';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";

const ImplV1 = Contracts.getFromLocal('ImplV1');

contract('create script', function([_, owner]) {
  const contractName = 'ImplV1';
  const contractAlias = 'Impl';
  const anotherContractName = 'AnotherImplV1';
  const anotherContractAlias = 'AnotherImpl';
  const uninitializableContractName = 'UninitializableImplV1';
  const uninitializableContractAlias = 'UninitializableImpl';
  const contractsData = [
    { name: contractName, alias: contractAlias},
    { name: anotherContractName, alias: anotherContractAlias },
    { name: uninitializableContractName, alias: uninitializableContractAlias }
  ];

  const network = 'test';
  const version = '1.1.0';
  const txParams = { from: owner };

  describe('upgradeable instances', function () {
    shouldAllowToCreateInstances(true)
  })

  describe('non-upgradeable instances', function () {
    shouldAllowToCreateInstances(false)
  })

  function shouldAllowToCreateInstances(upgradeable = true) {

    beforeEach('setup', async function() {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
      this.networkFile = this.packageFile.networkFile(network)

      await add({ contractsData, packageFile: this.packageFile });
      await push({ network, txParams, networkFile: this.networkFile });
    });

    const assertInstance = async function(networkFile, alias, { version, say, implementation }) {
      const instanceInfo = networkFile.instance(alias, 0)
      instanceInfo.address.should.be.nonzeroAddress;
      instanceInfo.version.should.eq(version);
      instanceInfo.upgradeable.should.be.eq(upgradeable);

      if (say) {
        const instance = await ImplV1.at(instanceInfo.address);
        const said = await instance.say();
        said.should.eq(say);
      }

      if (implementation) {
        instanceInfo.implementation.should.eq(implementation);
      }
    }

    it('should create an instance for one of its contracts', async function() {
      await create({ contractAlias, network, txParams, upgradeable, networkFile: this.networkFile });

      const implementation = this.networkFile.contract(contractAlias).address;
      await assertInstance(this.networkFile, contractAlias, { version, say: 'V1', implementation });
    });

    // TODO: for some reason this test fails on travis
    xit('should record the deployed instance address in contract build json file', async function () {
      await create({ contractAlias, network, txParams, upgradeable, networkFile: this.networkFile });

      const networks = Object.values(Contracts.getFromLocal(contractName).networks)
      const instanceAddress = this.networkFile.instance(contractAlias, 0).implementation
      networks.filter(network => network.address === instanceAddress).should.be.have.lengthOf(1)
    });

    it('should refuse to create an instance for an undefined contract', async function() {
      await create({ contractAlias: 'NotExists', network, txParams, upgradeable, networkFile: this.networkFile })
        .should.be.rejectedWith(/Contract NotExists not found/);
    });

    it('should refuse to create an instance for a lib project', async function() {
      this.packageFile.lib = true
      await create({ contractAlias, network, txParams, upgradeable, networkFile: this.networkFile })
        .should.be.rejectedWith(`Cannot create contract instances for a stdlib`);
    });

    it('should refuse to create an instance for an undeployed contract', async function() {
      const customContractsData = [{ name: contractName, alias: 'NotDeployed' }]
      await add({ contractsData: customContractsData, packageFile: this.packageFile });

      await create({ contractAlias: 'NotDeployed', network, txParams, upgradeable, networkFile: this.networkFile })
        .should.be.rejectedWith('Contract NotDeployed is not deployed to test.');
    });

    it('should be able to have multiple instances for one of its contracts', async function() {
      await create({ contractAlias, network, txParams, upgradeable, networkFile: this.networkFile });
      await create({ contractAlias, network, txParams, upgradeable, networkFile: this.networkFile });
      await create({ contractAlias, network, txParams, upgradeable, networkFile: this.networkFile });

      this.networkFile.instancesOf(contractAlias).should.have.lengthOf(3)
    });

    it('should be able to handle instances for more than one contract', async function() {
      await create({ contractAlias, network, txParams, upgradeable, networkFile: this.networkFile });
      await create({ contractAlias: anotherContractAlias, network, txParams, upgradeable, networkFile: this.networkFile });

      await assertInstance(this.networkFile, contractAlias, { version, say: 'V1' });
      await assertInstance(this.networkFile, anotherContractAlias, { version, say: 'AnotherV1' });
    });

    describe('warnings', function () {
      beforeEach('capturing log output', function () {
        this.logs = new CaptureLogs();
      });

      afterEach(function () {
        this.logs.restore();
      });

      it('should warn when not initializing an instance with initialize method', async function() {
        await create({ contractAlias, network, txParams, upgradeable, networkFile: this.networkFile });

        this.logs.errors.should.have.lengthOf(1);
        this.logs.errors[0].should.match(/make sure you initialize/i);
      });

      it('should warn when not initializing an instance that inherits from one with an initialize method', async function() {
        await create({ contractAlias: anotherContractAlias, network, txParams, upgradeable, networkFile: this.networkFile });

        this.logs.errors.should.have.lengthOf(1);
        this.logs.errors[0].should.match(/make sure you initialize/i);
      });

      it('should not warn when initializing an instance', async function() {
        await create({ contractAlias, network, txParams, initMethod: 'initialize', initArgs: [42], upgradeable, networkFile: this.networkFile });

        this.logs.errors.should.have.lengthOf(0);
      });

      it('should not warn when an instance has not initialize method', async function() {
        await create({ contractAlias: uninitializableContractAlias, network, txParams, upgradeable, networkFile: this.networkFile });

        this.logs.errors.should.have.lengthOf(0);
      });
    });

    describe('with stdlib', function () {
      beforeEach('setting stdlib', async function () {
        await linkStdlib({ stdlibNameVersion: 'mock-stdlib@1.1.0', packageFile: this.packageFile });
        await push({ network, txParams, deployStdlib: true, networkFile: this.networkFile });
      });

      it('should create an instance for a stdlib contract', async function () {
        await create({ contractAlias: 'Greeter', network, txParams, upgradeable, networkFile: this.networkFile });
        await assertInstance(this.networkFile, 'Greeter', { version });
      });
    });

    describe('with unpushed stdlib link', function () {
      beforeEach('setting stdlib', async function () {
        await linkStdlib({ stdlibNameVersion: 'mock-stdlib@1.1.0', packageFile: this.packageFile });
      });

      it('should refuse create a proxy for a stdlib contract', async function () {
        await create({ contractAlias: 'Greeter', network, txParams, networkFile: this.networkFile })
          .should.be.rejectedWith(/Contract Greeter is provided by mock-stdlib but it was not deployed to the network/)
      });
    });

    describe('with local modifications', function () {
      beforeEach('changing local network file to have a different bytecode', async function () {
        const contracts = this.networkFile.contracts
        contracts[contractAlias].bytecodeHash = '0xabcd'
        this.networkFile.contracts = contracts
      });

      it('should refuse to create an instance for a modified contract', async function () {
        await create({ contractAlias,network, txParams, upgradeable, networkFile: this.networkFile })
          .should.be.rejectedWith('Contract Impl has changed locally since the last deploy, consider running \'zos push\'.');
      });

      it('should create an instance for an unmodified contract', async function () {
        await create({ contractAlias: anotherContractAlias, network, txParams, upgradeable, networkFile: this.networkFile });

        await assertInstance(this.networkFile, anotherContractAlias, { version, say: 'AnotherV1' });
      });

      it('should create an instance for a modified contract if force is set', async function () {
        await create({ contractAlias, network, txParams, force: true, upgradeable, networkFile: this.networkFile });

        await assertInstance(this.networkFile, contractAlias, { version, say: 'V1' });
      });
    });
  }
});
