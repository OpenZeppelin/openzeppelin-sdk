'use strict'
require('../setup')

import push from "../../src/scripts/push.js";
import freeze from "../../src/scripts/freeze";
import addImplementation from "../../src/scripts/add-implementation";
import { FileSystem as fs, App, Package } from 'zos-lib'
import { cleanup, cleanupfn } from '../helpers/cleanup';
import bumpVersion from "../../src/scripts/bump-version";

const ImplV1 = artifacts.require('ImplV1');
const PackageContract = artifacts.require('Package');
const ImplementationDirectory = artifacts.require('ImplementationDirectory');

contract('push command', function([_, owner]) {
  const network = "test";
  const txParams = { from: owner }
  const defaultVersion = "1.1.0";

  const shouldDeployPackage = function (networkFileName) {
    it('should create a network file with version info', async function() {
      fs.exists(networkFileName).should.be.true;
      const networkData = fs.parseJson(networkFileName);
      networkData.version.should.eq(defaultVersion);
    });

    it('should include deployment addresses', async function () {
      const networkData = fs.parseJson(networkFileName);
      networkData.package.address.should.be.nonzeroAddress;
      networkData.provider.address.should.be.nonzeroAddress;
    });

    it('should deploy package at specified address', async function () {
      const address = fs.parseJson(networkFileName).package.address;
      const apackage = await PackageContract.at(address);
      (await apackage.hasVersion(defaultVersion)).should.be.true;
    });
  };

  const shouldDeployProvider = function (networkFileName) {
    it('should deploy provider at specified address', async function () {
      const address = fs.parseJson(networkFileName).provider.address;
      const directory = await ImplementationDirectory.at(address);
      (await directory.getImplementation("foo")).should.be.zeroAddress;
    });
  };

  const shouldDeployApp = function (networkFileName) {
    shouldDeployPackage(networkFileName);

    it('should deploy app at specified address', async function () {
      const address = fs.parseJson(networkFileName).app.address;
      address.should.be.nonzeroAddress;

      const app = await App.fetch(address);
      app.version.should.be.eq(defaultVersion);
    });
  };

  const shouldDeployLib = function (networkFileName) {
    shouldDeployPackage(networkFileName);

    it('should not be frozen by default', async function() {
      const data = fs.parseJson(networkFileName);
      data.frozen.should.be.false;
    });
  };

  const shouldDeployContracts = function ({ networkFileName }) {
    it('should record contracts in network file', async function () {
      const contract = fs.parseJson(networkFileName).contracts["Impl"];
      contract.address.should.be.nonzeroAddress;
      contract.bytecodeHash.should.not.be.empty;
      const deployed = await ImplV1.at(contract.address);
      (await deployed.say()).should.eq("V1");
    });

    it('should deploy contract instance', async function () {
      const address = fs.parseJson(networkFileName).contracts["Impl"].address;
      const deployed = await ImplV1.at(address);
      (await deployed.say()).should.eq("V1");
    });

    it('should register instances in directory', async function () {
      const data = fs.parseJson(networkFileName);
      const address = data.contracts["Impl"].address;
      const apackage = await Package.fetch(data.package.address);
      (await apackage.getImplementation(defaultVersion, "Impl")).should.eq(address);
    });
  };

  const shouldRedeployContracts = function ({ packageFileName, networkFileName }) {
    it('should not redeploy contracts if unmodified', async function () {
      const origAddress = fs.parseJson(networkFileName).contracts["Impl"].address;
      await push({ packageFileName, network, txParams });
      const newAddress = fs.parseJson(networkFileName).contracts["Impl"].address;
      origAddress.should.eq(newAddress);
    });

    it('should redeploy unmodified contract if forced', async function () {
      const origAddress = fs.parseJson(networkFileName).contracts["Impl"].address;
      await push({ packageFileName, network, txParams, reupload: true });
      const newAddress = fs.parseJson(networkFileName).contracts["Impl"].address;
      origAddress.should.not.eq(newAddress);
    });

    it('should redeploy contracts if modified', async function () {
      const networkData = fs.parseJson(networkFileName);
      const origAddress = networkData.contracts["Impl"].address;
      networkData.contracts["Impl"].bytecodeHash = "0xabab";
      fs.writeJson(networkFileName, networkData);

      await push({ packageFileName, network, txParams });
      const newAddress = fs.parseJson(networkFileName).contracts["Impl"].address;
      origAddress.should.not.eq(newAddress);
    });
  }

  const shouldBumpVersion = function ({ newPackageFileName, networkFileName }) {
    it('should keep package address when bumping version', async function () {
      const origPackageAddress = fs.parseJson(networkFileName).package.address;
      await push({ packageFileName: newPackageFileName, networkFileName, network, txParams });
      fs.parseJson(networkFileName).package.address.should.eq(origPackageAddress)
    });

    it('should update provider address when bumping version', async function () {
      await push({ packageFileName: newPackageFileName, networkFileName, network, txParams });
      const data = fs.parseJson(networkFileName);
      const providerAddress = data.provider.address;
      const apackage = await Package.fetch(data.package.address);
      (await apackage.getRelease('1.2.0')).address.should.eq(providerAddress);
    });

    it('should upload contracts to new directory when bumping version', async function () {
      await push({ packageFileName: newPackageFileName, networkFileName, network, txParams });
      const data = fs.parseJson(networkFileName);
      const implAddress = data.contracts["Impl"].address;
      const apackage = await Package.fetch(data.package.address);
      (await apackage.getImplementation('1.2.0', "Impl")).should.eq(implAddress);
    });
  };

  const shouldBumpVersionAndUnfreeze = function ({ newPackageFileName, networkFileName }) {
    shouldBumpVersion({ newPackageFileName, networkFileName })

    it('should set frozen back to false', async function() {
      await bumpVersion({ version: '1.1.0', packageFileName: newPackageFileName });
      await push({ packageFileName: newPackageFileName, networkFileName, network, txParams })
      await freeze({ network, packageFileName: newPackageFileName, networkFileName, txParams })
      const firstVersionData = fs.parseJson(networkFileName);
      firstVersionData.frozen.should.be.true;

      await bumpVersion({ version: '1.2.0', packageFileName: newPackageFileName });
      await addImplementation({ contractsData: [{ name: 'ImplV1', alias: 'Impl' }], packageFileName: newPackageFileName });
      await push({ packageFileName: newPackageFileName, networkFileName, network, txParams })
      const secondVersionData = fs.parseJson(networkFileName);
      secondVersionData.frozen.should.be.false;
    });
  }

  describe('an empty app', function() {
    const packageFileName = "test/mocks/packages/package-empty.zos.json";
    const networkFileName = "test/mocks/packages/package-empty.zos.test.json";

    beforeEach("pushing package-empty", async function () {
      cleanup(networkFileName)
      await push({ packageFileName, network, txParams })
    });

    after(cleanupfn(networkFileName));

    shouldDeployApp(networkFileName);
    shouldDeployProvider(networkFileName);
  });

  describe('an app with contracts', function() {
    const packageFileName =    "test/mocks/packages/package-with-contracts.zos.json";
    const newPackageFileName = "test/mocks/packages/package-with-contracts-v2.zos.json";
    const networkFileName =    "test/mocks/packages/package-with-contracts.zos.test.json";

    beforeEach("pushing package-with-contracts", async function () {
      cleanup(networkFileName)
      await push({ packageFileName, network, txParams })
    });

    after(cleanupfn(networkFileName));

    shouldDeployApp(networkFileName);
    shouldDeployProvider(networkFileName);
    shouldDeployContracts({ networkFileName });
    shouldRedeployContracts({ packageFileName, networkFileName });
    shouldBumpVersion({ networkFileName, newPackageFileName });
  });

  describe('an app with stdlib', function () {
    const stdlibAddress = "0x0000000000000000000000000000000000000010";

    describe('when using a valid stdlib', function () {
      const packageFileName = "test/mocks/packages/package-with-stdlib.zos.json";
      const networkFileName = "test/mocks/packages/package-with-stdlib.zos.test.json";

      beforeEach("pushing package-stdlib", async function () {
        cleanup(networkFileName)
        await push({ packageFileName, network, txParams })
      });

      after(cleanupfn(networkFileName));

      shouldDeployApp(networkFileName);

      it('should set stdlib in deployed app', async function () {
        const address = fs.parseJson(networkFileName).app.address;
        const app = await App.fetch(address);
        const stdlib = await app.currentStdlib();

        stdlib.should.eq(stdlibAddress);
      });

      it('should set address in network file', async function () {
        fs.parseJson(networkFileName).stdlib.address.should.eq(stdlibAddress);
      });
    })

    describe('when using an invalid stdlib', function () {
      const packageFileName = 'test/mocks/packages/package-with-invalid-stdlib.zos.json'

      it('should set address in network file', async function () {
        await push({ packageFileName, network, txParams })
          .should.be.rejectedWith('Requested stdlib version 1.0.0 does not match stdlib network package version 3.0.0')
      });
    })
  });

  describe('an empty lib', function() {
    const packageFileName = "test/mocks/packages/package-empty-lib.zos.json";
    const networkFileName = "test/mocks/packages/package-empty-lib.zos.test.json";

    beforeEach("pushing package-empty", async function () {
      cleanup(networkFileName)
      await push({ packageFileName, network, txParams })
    });

    after(cleanupfn(networkFileName));

    shouldDeployLib(networkFileName);
    shouldDeployProvider(networkFileName);
  });

  describe('a lib with contracts', function() {
    const packageFileName =    "test/mocks/packages/package-lib-with-contracts.zos.json";
    const newPackageFileName = "test/mocks/packages/package-lib-with-contracts-v2.zos.json";
    const networkFileName =    "test/mocks/packages/package-lib-with-contracts.zos.test.json";

    beforeEach("pushing package-with-contracts", async function () {
      cleanup(networkFileName)
      await push({ packageFileName, network, txParams })
    });

    after(cleanupfn(networkFileName));

    shouldDeployLib(networkFileName);
    shouldDeployProvider(networkFileName);
    shouldDeployContracts({ networkFileName });
    shouldRedeployContracts({ packageFileName, networkFileName });
    shouldBumpVersionAndUnfreeze({ networkFileName, packageFileName, newPackageFileName });

    it('should refuse to push when frozen', async function() {
      await freeze({ network, packageFileName, networkFileName, txParams })
      await push({ packageFileName, network, networkFileName, txParams }).should.be.rejectedWith(/frozen/i)
    });
  });

  describe('an app with invalid contracts', function() {
    const packageFileName = "test/mocks/packages/package-with-invalid-contracts.zos.json";
    const networkFileName = "test/mocks/packages/package-with-invalid-contracts.zos.test.json";

    beforeEach("pushing package-with-contracts", async function () {
      cleanup(networkFileName)
      await push({ packageFileName, network, txParams }).should.be.rejectedWith(/WithFailingConstructor deployment failed /);
    });

    after(cleanupfn(networkFileName));

    shouldDeployApp(networkFileName);
    shouldDeployProvider(networkFileName);
    shouldDeployContracts({ networkFileName });
  });
});
