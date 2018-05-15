import { FileSystem as fs } from 'zos-lib'
import push from "../../src/scripts/push.js";
import { cleanup, cleanupfn } from '../helpers/cleanup';

const Package = artifacts.require('Package');
const PackagedApp = artifacts.require('PackagedApp');
const AppDirectory = artifacts.require('AppDirectory');

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('../helpers/assertions'))
  .should();

contract('push-with-stdlib', function([_, owner]) {

  const from = owner;
  const txParams = { from };
  const network = "test";
  const defaultVersion = "1.0";

  describe('a package with stdlib', function () {
    const packageFileName = "test/mocks/packages/package-with-contracts-and-stdlib.zos.json";
    const networkFileName = "test/mocks/packages/package-with-contracts-and-stdlib.zos.test.json";

    beforeEach("syncing package-stdlib", async function () {
      cleanup(networkFileName)
      await push({ packageFileName, network, txParams, deployStdlib: true })
    });

    after(cleanupfn(networkFileName));

    it('should create a network file', async function() {
      fs.exists(networkFileName).should.be.true;
    });

    it('should include deployment address', async function () {
      fs.parseJson(networkFileName).app.address.should.be.not.null;
    });

    it('should include stdlib address', async function () {
      fs.parseJson(networkFileName).stdlib.address.should.be.nonzeroAddress;
    });

    describe('on app', function () {

      beforeEach('loading app', async function () {
        const address = fs.parseJson(networkFileName).app.address;
        this.app = await PackagedApp.at(address);
      });

      it('should set version', async function () {
        (await this.app.version()).should.eq(defaultVersion);
      });

      it('should set stdlib', async function () {
        const appPackage = await Package.at(await this.app.package());
        const provider = await AppDirectory.at(await appPackage.getVersion(defaultVersion));
        const stdlib = await provider.stdlib();

        stdlib.should.be.nonzeroAddress;
      });

      it('should set stdlib address in network file', async function () {
        fs.parseJson(networkFileName).stdlib.address.should.be.not.null;
      });

      it('should retrieve a mock from app directory', async function () {
        const address = await this.app.getImplementation('Impl');
        address.should.be.nonzeroAddress;
      });

      it('should retrieve a mock from stdlib', async function () {
        const address = await this.app.getImplementation('Greeter');
        address.should.be.nonzeroAddress;
      });

    });

    describe('followed by push', function () {

      const stdlibPackageAddress = '0x0000000000000000000000000000000000000010';
      
      beforeEach('running push', async function () {
        this.stdlibAddress = fs.parseJson(networkFileName).stdlib.address;
        await push({ packageFileName, network, txParams })
      });    

      it('should preserve stdlib address in JSON file', async function () {
        const stdlibAddress = fs.parseJson(networkFileName).stdlib.address;
        stdlibAddress.should.not.eq(stdlibPackageAddress);
        stdlibAddress.should.eq(this.stdlibAddress);
      });

      it('should preserve stdlib address in provider', async function () {
        const address = fs.parseJson(networkFileName).app.address;
        const app = await PackagedApp.at(address);
        const appPackage = await Package.at(await app.package());
        const provider = await AppDirectory.at(await appPackage.getVersion(defaultVersion));
        const stdlib = await provider.stdlib();

        stdlib.should.eq(this.stdlibAddress);
      });

    });

    describe('followed by push with a different stdlib', function () {

      const stdlib2PackageAddress = '0x0000000000000000000000000000000000000210';
      const packageFileName = "test/mocks/packages/package-with-contracts-and-stdlib-v2.zos.json";

      beforeEach('running push', async function () {
        await push({ packageFileName, networkFileName, network, txParams })
      });

      it('should include stdlib address in JSON file', async function () {
        const address = fs.parseJson(networkFileName).stdlib.address;
        address.should.eq(stdlib2PackageAddress)
      });

      it('should set stdlib address in provider', async function () {
        const address = fs.parseJson(networkFileName).app.address;
        const app = await PackagedApp.at(address);
        const appPackage = await Package.at(await app.package());
        const provider = await AppDirectory.at(await appPackage.getVersion(defaultVersion));
        const stdlib = await provider.stdlib();

        stdlib.should.eq(stdlib2PackageAddress);
      });

    });
    
  });

});
