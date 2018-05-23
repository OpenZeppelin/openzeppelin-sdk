'use strict'
require('../setup')

import { Logger, FileSystem as fs } from 'zos-lib';
import { cleanup, cleanupfn } from '../helpers/cleanup.js';

import init from '../../src/scripts/init.js';
import push from '../../src/scripts/push.js';
import createProxy from '../../src/scripts/create.js';
import linkStdlib from '../../src/scripts/link.js';
import add from '../../src/scripts/add.js';
import CaptureLogs from '../helpers/captureLogs';

const ImplV1 = artifacts.require('ImplV1');

contract('create command', function([_, owner]) {
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

  const txParams = { from: owner };
  const appName = 'MyApp';
  const defaultVersion = '0.1.0';
  const network = 'test';
  const packageFileName = 'test/tmp/zos.json';
  const networkFileName = `test/tmp/zos.${network}.json`;

  beforeEach('setup', async function() {
    cleanup(packageFileName)
    cleanup(networkFileName)
    await init({ name: appName, version: defaultVersion, packageFileName });
    await add({ contractsData, packageFileName });
    await push({ packageFileName, network, txParams });
  });

  after(cleanupfn(packageFileName))
  after(cleanupfn(networkFileName))

  const assertProxy = async function(proxyInfo, { version, say, implementation }) {
    proxyInfo.address.should.be.nonzeroAddress;
    proxyInfo.version.should.eq(version);

    if (say) {
      const proxy = await ImplV1.at(proxyInfo.address);
      const said = await proxy.say();
      said.should.eq(say);
    }

    if (implementation) {
      proxyInfo.implementation.should.eq(implementation);
    }
  }

  it('should create a proxy for one of its contracts', async function() {
    await createProxy({ contractAlias, packageFileName, network, txParams });
    const data = fs.parseJson(networkFileName);
    const implementation = data.contracts[contractAlias].address;
    await assertProxy(data.proxies[contractAlias][0], { version: defaultVersion, say: 'V1', implementation });
  });

  it('should refuse to create a proxy for an undefined contract', async function() {
    await createProxy({ contractAlias: 'NotExists', packageFileName, network, txParams }).should.be.rejectedWith(/not found/);
  });

  it('should refuse to create a proxy for a lib project', async function() {
    fs.editJson(packageFileName, p => { p.lib = true; });
    await createProxy({ contractAlias, packageFileName, network, txParams }).should.be.rejectedWith(/lib/);
  });

  it('should refuse to create a proxy for an undeployed contract', async function() {
    const customContractsData = [{ name: contractName, alias: 'NotDeployed' }]
    await add({ contractsData: customContractsData, packageFileName });
    await createProxy({ contractAlias: 'NotDeployed', packageFileName, network, txParams }).should.be.rejectedWith(/not deployed/);
  });

  it('should be able to have multiple proxies for one of its contracts', async function() {
    await createProxy({ contractAlias, packageFileName, network, txParams });
    await createProxy({ contractAlias, packageFileName, network, txParams });
    await createProxy({ contractAlias, packageFileName, network, txParams });
    const data = fs.parseJson(networkFileName);
    data.proxies[contractAlias].should.have.lengthOf(3);
  });

  it('should be able to handle proxies for more than one contract', async function() {
    await createProxy({ contractAlias, packageFileName, network, txParams });
    await createProxy({ contractAlias: anotherContractAlias, packageFileName, network, txParams });
    const data = fs.parseJson(networkFileName);
    await assertProxy(data.proxies[contractAlias][0], { version: defaultVersion, say: 'V1' });
    await assertProxy(data.proxies[anotherContractAlias][0], { version: defaultVersion, say: 'AnotherV1' });
  });

  describe('warnings', function () {
    beforeEach('capturing log output', function () {
      this.logs = new CaptureLogs();
    });

    afterEach(function () {
      this.logs.restore();
    });

    it('should warn when not initializing a contract with initialize method', async function() {
      await createProxy({ contractAlias, packageFileName, network, txParams });
      this.logs.errors.should.have.lengthOf(1);
      this.logs.errors[0].should.match(/make sure you initialize/i);
    });

    it('should warn when not initializing a contract that inherits from one with an initialize method', async function() {
      await createProxy({ contractAlias: anotherContractAlias, packageFileName, network, txParams });
      this.logs.errors.should.have.lengthOf(1);
      this.logs.errors[0].should.match(/make sure you initialize/i);
    });

    it('should not warn when initializing a contract', async function() {
      await createProxy({ contractAlias, packageFileName, network, txParams, initMethod: 'initialize', initArgs: [42] });
      this.logs.errors.should.have.lengthOf(0);
    });

    it('should not warn when a contract has not initialize method', async function() {
      await createProxy({ contractAlias: uninitializableContractAlias, packageFileName, network, txParams });
      this.logs.errors.should.have.lengthOf(0);
    });
  });

  describe('with stdlib', function () {
    beforeEach('setting stdlib', async function () {
      await linkStdlib({ stdlibNameVersion: 'mock-stdlib@1.1.0', packageFileName });
      await push({ packageFileName, network, txParams, deployStdlib: true });
    });

    it('should create a proxy for a stdlib contract', async function () {
      await createProxy({ contractAlias: 'Greeter', packageFileName, network, txParams });
      const data = fs.parseJson(networkFileName);
      await assertProxy(data.proxies['Greeter'][0], { version: defaultVersion });
    });
  });

  describe('with local modifications', function () {
    beforeEach('changing local network file to have a different bytecode', async function () {
      const data = fs.parseJson(networkFileName);
      data.contracts[contractAlias].bytecodeHash = '0xabcd';
      fs.writeJson(networkFileName, data);
    });

    it('should refuse to create a proxy for a modified contract', async function () {
      await createProxy({ contractAlias, packageFileName, network, txParams }).should.be.rejectedWith(/has changed/);
    });

    it('should create a proxy for an unmodified contract', async function () {
      await createProxy({ contractAlias: anotherContractAlias, packageFileName, network, txParams });
      const data = fs.parseJson(networkFileName);
      await assertProxy(data.proxies[anotherContractAlias][0], { version: defaultVersion, say: 'AnotherV1' });
    });

    it('should create a proxy for a modified contract if force is set', async function () {
      await createProxy({ contractAlias, packageFileName, network, txParams, force: true });
      const data = fs.parseJson(networkFileName);
      await assertProxy(data.proxies[contractAlias][0], { version: defaultVersion, say: 'V1' });
    });
  });
  
});
