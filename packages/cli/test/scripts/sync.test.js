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
  const defaultVersion = "1.1.0";

  const cleanup = async function(filename) {
    try {
      fs.unlinkSync(filename);
    } catch(e) { /* swallow exception */ }
  }

  describe('an empty package', function() {

    const packageFileName = "test/mocks/packages/package-empty.zos.json";
    const networkFileName = "package.zos.test.json"; // TODO: Should generate file in same directory as package file, with the same file pattern (package-empty in this case)

    beforeEach("syncing package-empty", async function () {
      await cleanup(networkFileName)
      await sync({ packageFileName, network, from })
    });

    it('should create a network file', async function() {
      fs.existsSync(networkFileName).should.be.true;
    });

    it('should include deployment address', async function () {
      JSON.parse(fs.readFileSync(networkFileName)).app.address.should.be.not.null;
    });

    it('should deploy app at specified address', async function () {
      const address = JSON.parse(fs.readFileSync(networkFileName)).app.address;
      const appManager = await AppManager.at(address);
      (await appManager.version()).should.eq(defaultVersion);
    });

  });
  
});
