import sync from "../../src/scripts/sync.js";
import fs from 'fs';

const AppManager = artifacts.require('PackagedAppManager');

const should = require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('sync', function([_, owner]) {

  const network = "test";
  const from = owner;
  const appName = "MyApp";
  const defaultVersion = "0.1.0";

  describe('an empty package', function() {

    const packageFileName = "test/mocks/packages/package-empty.zos.json";
    const networkFileName = "test/mocks/packages/package-empty.zos.testnet.json";

    beforeEach("syncing package-empty", async function () {
      await sync({ packageFileName, network, from })
    });

    afterEach('cleanup', function(cb) {
      fs.unlink(networkFileName, () => cb());
    });

    it('should create a network file', async function() {
      fs.existsSync(networkFileName).should.be.true;
    });

    it('should include deployment address', async function () {
      fs.readFileSync(networkFileName).app.address.should.be.not.null;
    });

    it('should deploy app at specified address', async function () {
      const address = fs.readFileSync(networkFileName).app.address;
      const appManager = await AppManager.at(address);
      (await appManager.version()).should.eq(defaultVersion);
    });

  });
  
});
