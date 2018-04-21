import deployAll from "../../src/scripts/deploy-all";
import fs from 'fs';
import { cleanup, cleanupfn } from '../helpers/cleanup';
import PackageFilesInterface from "../../src/utils/PackageFilesInterface.js";

const AppManager = artifacts.require('PackagedAppManager');
const Package = artifacts.require('Package');
const AppDirectory = artifacts.require('AppDirectory');

const should = require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('deployAll', function([_, owner]) {

  const network = "test";
  const from = owner;
  const appName = "MyApp";
  const defaultVersion = "1.0";

  describe('a package with stdlib', function () {
    const packageFileName = "test/mocks/packages/package-with-contracts-and-stdlib.zos.json";
    const networkFileName = "package.zos.test.json"; // TODO: Should generate file in same directory as package file, with the same file pattern (package-empty in this case)
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    
    beforeEach("syncing package-stdlib", async function () {
      cleanup(networkFileName)
      await deployAll({ packageFileName, network, from })
    });

    after(cleanupfn(networkFileName));

    it('should create a network file', async function() {
      fs.existsSync(networkFileName).should.be.true;
    });

    it('should include deployment address', async function () {
      JSON.parse(fs.readFileSync(networkFileName)).app.address.should.be.not.null;
    });

    it('should include stdlib address', async function () {
      JSON.parse(fs.readFileSync(networkFileName)).stdlib.address.should.not.eq(ZERO_ADDRESS);
    });

    describe('AppManager', function () {

      beforeEach('loading appManager', async function () {
        const address = JSON.parse(fs.readFileSync(networkFileName)).app.address;
        this.appManager = await AppManager.at(address);
      });

      it('should set version', async function () {
        (await this.appManager.version()).should.eq(defaultVersion);
      });

      it('should set stdlib', async function () {
        const appPackage = await Package.at(await this.appManager.package());
        const provider = await AppDirectory.at(await appPackage.getVersion(defaultVersion));
        const stdlib = await provider.stdlib();

        stdlib.should.not.eq(ZERO_ADDRESS);
      });

      it('should set stdlib address in network file', async function () {
        JSON.parse(fs.readFileSync(networkFileName)).stdlib.address.should.be.not.null;
      });

      it('should retrieve a mock from app directory', async function () {
        const address = await this.appManager.getImplementation('Impl');
        address.should.not.eq(ZERO_ADDRESS);
      });

      it('should retrieve a mock from stdlib', async function () {
        const address = await this.appManager.getImplementation('Greeter');
        address.should.not.eq(ZERO_ADDRESS);
      });

    });
    
  });
  
});
