import { FileSystem as fs } from 'zos-lib'
import sync from "../../src/scripts/sync.js";
import { cleanup, cleanupfn } from '../helpers/cleanup';

const AppManager = artifacts.require('PackagedAppManager');
const Package = artifacts.require('Package');
const AppDirectory = artifacts.require('AppDirectory');

const should = require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('sync', function([_, owner]) {

  const network = "test";
  const from = owner;
  const defaultVersion = "1.1.0";

  describe('an empty package', function() {

    const packageFileName = "test/mocks/packages/package-empty.zos.json";
    const networkFileName = "test/mocks/packages/package-empty.zos.test.json";

    beforeEach("syncing package-empty", async function () {
      cleanup(networkFileName)
      await sync({ packageFileName, network, from })
    });

    after(cleanupfn(networkFileName));

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
