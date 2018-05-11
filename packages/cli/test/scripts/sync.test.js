import { FileSystem as fs, AppManagerProvider } from 'zos-lib'
import sync from "../../src/scripts/sync.js";
import { cleanup, cleanupfn } from '../helpers/cleanup';
import { promisify } from 'util';

const AppManager = artifacts.require('PackagedAppManager');
const Package = artifacts.require('Package');
const AppDirectory = artifacts.require('AppDirectory');
const ImplV1 = artifacts.require('ImplV1');

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('../helpers/assertions'))
  .should();

contract('sync', function([_, owner]) {

  const network = "test";
  const from = owner;
  const defaultVersion = "1.1.0";

  const shouldDeployApp = function (networkFileName) {
    it('should create a network file', async function() {
      fs.exists(networkFileName).should.be.true;
    });

    it('should include deployment address', async function () {
      fs.parseJson(networkFileName).app.address.should.be.not.null;
    });

    it('should deploy app at specified address', async function () {
      const address = fs.parseJson(networkFileName).app.address;
      const appManager = await AppManager.at(address);
      (await appManager.version()).should.eq(defaultVersion);
    });
  };

  describe('an empty package', function() {
    const packageFileName = "test/mocks/packages/package-empty.zos.json";
    const networkFileName = "test/mocks/packages/package-empty.zos.test.json";

    beforeEach("syncing package-empty", async function () {
      cleanup(networkFileName)
      await sync({ packageFileName, network, from })
    });

    after(cleanupfn(networkFileName));

    shouldDeployApp(networkFileName);
  });

  describe('a package with contracts', function() {
    const packageFileName = "test/mocks/packages/package-with-contracts.zos.json";
    const networkFileName = "test/mocks/packages/package-with-contracts.zos.test.json";

    beforeEach("syncing package-with-contracts", async function () {
      cleanup(networkFileName)
      await sync({ packageFileName, network, from })
    });

    after(cleanupfn(networkFileName));

    shouldDeployApp(networkFileName);

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
      const appManagerWrapper = await AppManagerProvider.from(fs.parseJson(networkFileName).app.address);
      const address = fs.parseJson(networkFileName).contracts["Impl"].address;
      const directory = appManagerWrapper.currentDirectory();
      (await directory.getImplementation("Impl")).should.eq(address);
    });

    it('should log instance deployment', async function () {
      const appManagerWrapper = await AppManagerProvider.from(fs.parseJson(networkFileName).app.address);
      const address = fs.parseJson(networkFileName).contracts["Impl"].address;
      const directory = appManagerWrapper.currentDirectory();
      (await directory.getImplementation("Impl")).should.eq(address);
    });

    it('should not redeploy contracts if unmodified', async function () {
      const origAddress = fs.parseJson(networkFileName).contracts["Impl"].address;
      await sync({ packageFileName, network, from });
      const newAddress = fs.parseJson(networkFileName).contracts["Impl"].address;
      origAddress.should.eq(newAddress);
    });

    it('should redeploy unmodified contract if forced', async function () {
      const origAddress = fs.parseJson(networkFileName).contracts["Impl"].address;
      await sync({ packageFileName, network, from, reupload: true });
      const newAddress = fs.parseJson(networkFileName).contracts["Impl"].address;
      origAddress.should.not.eq(newAddress);
    });

    it('should redeploy contracts if modified', async function () {
      const networkData = fs.parseJson(networkFileName);
      const origAddress = networkData.contracts["Impl"].address;
      networkData.contracts["Impl"].bytecodeHash = "0xabab";
      fs.writeJson(networkFileName, networkData);

      await sync({ packageFileName, network, from });
      const newAddress = fs.parseJson(networkFileName).contracts["Impl"].address;
      origAddress.should.not.eq(newAddress);
    });

    it('should upload contracts to new directory when bumping version', async function () {
      const newPackageFileName = "test/mocks/packages/package-with-contracts-2.zos.json";
      await sync({ packageFileName: newPackageFileName, networkFileName, network, from });
      const address = fs.parseJson(networkFileName).contracts["Impl"].address;
      const appManagerWrapper = await AppManagerProvider.from(fs.parseJson(networkFileName).app.address);
      appManagerWrapper.version.should.eq('1.2.0');
      const directory = appManagerWrapper.currentDirectory();
      (await directory.getImplementation("Impl")).should.eq(address);
    });
  });

  describe('a package with stdlib', function () {
    const stdlibAddress = "0x0000000000000000000000000000000000000010";
    const packageFileName = "test/mocks/packages/package-with-stdlib.zos.json";
    const networkFileName = "test/mocks/packages/package-with-stdlib.zos.test.json";

    beforeEach("syncing package-stdlib", async function () {
      cleanup(networkFileName)
      await sync({ packageFileName, network, from })
    });

    after(cleanupfn(networkFileName));

    shouldDeployApp(networkFileName);

    it('should set stdlib in deployed app', async function () {
      const address = fs.parseJson(networkFileName).app.address;
      const appManager = await AppManager.at(address);
      const appPackage = await Package.at(await appManager.package());
      const provider = await AppDirectory.at(await appPackage.getVersion(defaultVersion));
      const stdlib = await provider.stdlib();

      stdlib.should.eq(stdlibAddress);
    });

    it('should set address in network file', async function () {
      fs.parseJson(networkFileName).stdlib.address.should.eq(stdlibAddress);
    });  
  });
  
});
