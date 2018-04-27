import deployAll from "../../src/scripts/deploy-all";
import sync from "../../src/scripts/sync.js";
import setStdlib from "../../src/scripts/set-stdlib.js";
import fs from 'fs';
import { cleanup, cleanupfn } from '../helpers/cleanup';
import PackageFilesInterface from "../../src/utils/PackageFilesInterface.js";


const AppManager = artifacts.require('PackagedAppManager');
const Package = artifacts.require('Package');
const AppDirectory = artifacts.require('AppDirectory');

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('../helpers/assertions'))
  .should();

contract('deployAll', function([_, owner]) {

  const network = "test";
  const from = owner;
  const appName = "MyApp";
  const defaultVersion = "1.0";

  describe('a package with stdlib', function () {
    const packageFileName = "test/mocks/packages/package-with-contracts-and-stdlib.zos.json";
    const networkFileName = "package.zos.test.json"; // TODO: Should generate file in same directory as package file, with the same file pattern (package-empty in this case)

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
      const address = JSON.parse(fs.readFileSync(networkFileName)).stdlib.address;
      address.should.be.nonzeroAddress;
    });

    describe('on appManager', function () {

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

        stdlib.should.be.nonzeroAddress;
      });

      it('should set stdlib address in network file', async function () {
        JSON.parse(fs.readFileSync(networkFileName)).stdlib.address.should.be.not.null;
      });

      it('should retrieve a mock from app directory', async function () {
        const address = await this.appManager.getImplementation('Impl');
        address.should.be.nonzeroAddress;
      });

      it('should retrieve a mock from stdlib', async function () {
        const address = await this.appManager.getImplementation('Greeter');
        address.should.be.nonzeroAddress;
      });

    });

    describe('followed by sync', function () {

      const stdlibPackageAddress = '0x0000000000000000000000000000000000000010';
      
      beforeEach('running sync', async function () {
        this.stdlibAddress = JSON.parse(fs.readFileSync(networkFileName)).stdlib.address;
        await sync({ packageFileName, network, from })
      });    

      it('should preserve stdlib address in JSON file', async function () {
        const stdlibAddress = JSON.parse(fs.readFileSync(networkFileName)).stdlib.address;
        stdlibAddress.should.not.eq(stdlibPackageAddress);
        stdlibAddress.should.eq(this.stdlibAddress);
      });

      it('should preserve stdlib address in provider', async function () {
        const address = JSON.parse(fs.readFileSync(networkFileName)).app.address;
        const appManager = await AppManager.at(address);
        const appPackage = await Package.at(await appManager.package());
        const provider = await AppDirectory.at(await appPackage.getVersion(defaultVersion));
        const stdlib = await provider.stdlib();

        stdlib.should.eq(this.stdlibAddress);
      });

    });

    describe('followed by sync with a different stdlib', function () {

      const stdlib2PackageAddress = '0x0000000000000000000000000000000000000210';
      const packageFileName = "test/mocks/packages/package-with-contracts-and-stdlib-2.zos.json";

      beforeEach('running sync', async function () {
        await sync({ packageFileName, network, from })
      });

      it('should include stdlib address in JSON file', async function () {
        const address = JSON.parse(fs.readFileSync(networkFileName)).stdlib.address;
        address.should.eq(stdlib2PackageAddress)
      });

      it('should set stdlib address in provider', async function () {
        const address = JSON.parse(fs.readFileSync(networkFileName)).app.address;
        const appManager = await AppManager.at(address);
        const appPackage = await Package.at(await appManager.package());
        const provider = await AppDirectory.at(await appPackage.getVersion(defaultVersion));
        const stdlib = await provider.stdlib();

        stdlib.should.eq(stdlib2PackageAddress);
      });

    });
    
  });

});
