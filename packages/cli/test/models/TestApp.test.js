'use strict'
require('../setup')

import { Contracts } from 'zos-lib'
import testApp from '../../src/models/TestApp';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";

const ImplV1 = Contracts.getFromLocal('ImplV1');

contract.skip('TestApp', function ([_, owner]) {
  const txParams = { from: owner }
  const initialVersion = "1.0";

  beforeEach("deploying all contracts", async function () {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts-and-stdlib.zos.json')
    this.networkFile = this.packageFile.networkFile('test')
    this.app = await testApp(txParams, this.networkFile)
    this.directory = this.app.currentDirectory();
  });

  it('deploys all contracts', async function() {
    this.app._app.address.should.not.be.null;
    this.app.factory.address.should.not.be.null;
    this.app.package.address.should.not.be.null;
  });

  it('sets app at initial version', async function () {
    (await this.app._app.version()).should.eq(initialVersion);
  });

  it('registers initial version in package', async function () {
    (await this.app.package.hasVersion(initialVersion)).should.be.true;
  });

  it('initializes all app properties', async function () {
    this.app.version.should.eq(initialVersion);
    this.app.directories.should.have.key(initialVersion);
  });

  it('returns the current directory', async function () {
    this.app.currentDirectory().address.should.be.not.null;
  });
    
  it.skip('deploys stdlib', async function () {
    (await this.directory.stdlib()).should.be.not.null;
  })

  it('retrieves a mock from app directory', async function () {
    const proxy = await this.app.createProxy(ImplV1, "Impl");
    (await proxy.say()).should.eq('V1');
  });
 });
