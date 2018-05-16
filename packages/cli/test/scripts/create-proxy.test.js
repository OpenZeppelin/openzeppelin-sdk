'use strict'
require('../setup')

import init from "../../src/scripts/init.js";
import push from "../../src/scripts/push.js";
import { cleanup, cleanupfn } from "../helpers/cleanup.js";
import { FileSystem as fs } from "zos-lib";
import createProxy from "../../src/scripts/create-proxy.js";
import addImplementation from "../../src/scripts/add-implementation.js";
import linkStdlib from "../../src/scripts/link-stdlib.js";

const ImplV1 = artifacts.require('ImplV1');

contract('create-proxy command', function([_, owner]) {
  const txParams = { from: owner };
  const appName = "MyApp";
  const contractName = "ImplV1";
  const contractAlias = "Impl";
  const anotherContractName = "AnotherImplV1";
  const anotherContractAlias = "AnotherImpl";
  const contractsData = [{ name: contractName, alias: contractAlias}, { name: anotherContractName, alias: anotherContractAlias }]
  const defaultVersion = "0.1.0";
  const network = "test";
  const packageFileName = "test/tmp/package.zos.json";
  const networkFileName = `test/tmp/package.zos.${network}.json`;

  beforeEach('setup', async function() {
    cleanup(packageFileName)
    cleanup(networkFileName)
    await init({ name: appName, version: defaultVersion, packageFileName });
    await addImplementation({ contractsData, packageFileName });
    await push({ packageFileName, network, txParams });
  });

  after(cleanupfn(packageFileName))
  after(cleanupfn(networkFileName))

  const assertProxy = async function(proxyInfo, { version, say }) {
    proxyInfo.address.should.be.nonzeroAddress;
    proxyInfo.version.should.eq(version);

    if (say) {
      const proxy = await ImplV1.at(proxyInfo.address);
      const said = await proxy.say();
      said.should.eq(say);
    }
  }

  it('should create a proxy for one of its contracts', async function() {
    await createProxy({ contractAlias, packageFileName, network, txParams });
    const data = fs.parseJson(networkFileName);
    await assertProxy(data.proxies[contractAlias][0], { version: defaultVersion, say: "V1" });
  });

  it('should refuse to create a proxy for an undefined contract', async function() {
    await createProxy({ contractAlias: "NotExists", packageFileName, network, txParams }).should.be.rejectedWith(/not found/);
  });

  it('should refuse to create a proxy for an undeployed contract', async function() {
    const customContractsData = [{ name: contractName, alias: "NotDeployed" }]
    await addImplementation({ contractsData: customContractsData, packageFileName });
    await createProxy({ contractAlias: "NotDeployed", packageFileName, network, txParams }).should.be.rejectedWith(/not deployed/);
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
    await assertProxy(data.proxies[contractAlias][0], { version: defaultVersion, say: "V1" });
    await assertProxy(data.proxies[anotherContractAlias][0], { version: defaultVersion, say: "AnotherV1" });
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
    beforeEach("changing local network file to have a different bytecode", async function () {
      const data = fs.parseJson(networkFileName);
      data.contracts[contractAlias].bytecodeHash = "0xabcd";
      fs.writeJson(networkFileName, data);
    });

    it('should refuse to create a proxy for a modified contract', async function () {
      await createProxy({ contractAlias, packageFileName, network, txParams }).should.be.rejectedWith(/has changed/);
    });

    it('should create a proxy for an unmodified contract', async function () {
      await createProxy({ contractAlias: anotherContractAlias, packageFileName, network, txParams });
      const data = fs.parseJson(networkFileName);
      await assertProxy(data.proxies[anotherContractAlias][0], { version: defaultVersion, say: "AnotherV1" });
    });

    it('should create a proxy for a modified contract if force is set', async function () {
      await createProxy({ contractAlias, packageFileName, network, txParams, force: true });
      const data = fs.parseJson(networkFileName);
      await assertProxy(data.proxies[contractAlias][0], { version: defaultVersion, say: "V1" });
    });
  });
  
});
