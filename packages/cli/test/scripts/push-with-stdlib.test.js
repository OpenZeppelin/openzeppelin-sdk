'use strict'
require('../setup')

import { App } from 'zos-lib'
import push from '../../src/scripts/push.js'
import ZosPackageFile from '../../src/models/files/ZosPackageFile'

contract.skip('push-with-stdlib script', function([_, owner]) {
  const network = 'test';
  const version = '1.0';
  const txParams = { from: owner };

  describe('a package with stdlib', function () {

    beforeEach('syncing package-stdlib', async function () {
      const packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts-and-stdlib.zos.json')
      this.networkFile = packageFile.networkFile(network)
      await push({ network, txParams, deployStdlib: true, networkFile: this.networkFile })
    });

    it('should include deployment address', async function () {
      this.networkFile.appAddress.should.be.not.null;
    });

    it('should include stdlib address', async function () {
      this.networkFile.stdlibAddress.should.be.nonzeroAddress;
    });

    describe('on app', function () {
      beforeEach('loading app', async function () {
        this.app = await App.fetch(this.networkFile.appAddress);
      });

      it('should set version', async function () {
        (await this.app.version).should.eq(version);
      });

      it('should set stdlib', async function () {
        const stdlib = await this.app.currentStdlib();
        stdlib.should.be.nonzeroAddress;
      });

      it('should set stdlib address in network file', async function () {
        this.networkFile.stdlibAddress.should.be.not.null;
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
        this.stdlibAddress = this.networkFile.stdlibAddress;
        await push({ network, txParams, networkFile: this.networkFile })
      });    

      it('should preserve stdlib address in JSON file', async function () {
        const stdlibAddress = this.networkFile.stdlibAddress;
        stdlibAddress.should.not.eq(stdlibPackageAddress);
        stdlibAddress.should.eq(this.stdlibAddress);
      });

      it('should preserve stdlib address in provider', async function () {
        const app = await App.fetch(this.networkFile.appAddress)
        const stdlib = await app.currentStdlib();

        stdlib.should.eq(this.stdlibAddress);
      });
    });

    describe('followed by push with a different stdlib', function () {
      const stdlib2PackageAddress = '0x0000000000000000000000000000000000000210';

      beforeEach('running push', async function () {
        const packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts-and-stdlib-v2.zos.json')
        this.networkFile = packageFile.networkFile(network)
        await push({ network, txParams, networkFile: this.networkFile })
      });

      it('should include stdlib address in JSON file', async function () {
        this.networkFile.stdlibAddress.should.eq(stdlib2PackageAddress)
      });

      it('should set stdlib address in provider', async function () {
        const app = await App.fetch(this.networkFile.appAddress)
        const stdlib = await app.currentStdlib();

        stdlib.should.eq(stdlib2PackageAddress);
      });
    });
  });
});
