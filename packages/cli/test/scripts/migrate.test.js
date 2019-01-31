'use strict'
require('../setup')

import utils from 'web3-utils';
import { Proxy, Contracts, toSemanticVersion } from 'zos-lib'

import push from '../../src/scripts/push';
import create from '../../src/scripts/create';
import update from '../../src/scripts/update';
import publish from '../../src/scripts/publish';
import setAdmin from '../../src/scripts/set-admin';
import ZosPackageFile from '../../src/models/files/ZosPackageFile';

const should = require('chai').should();

const Package = Contracts.getFromLib('Package');
const DeprecatedApp = Contracts.getFromLib('DeprecatedApp');
const ImplementationDirectory = Contracts.getFromLib('ImplementationDirectory');

contract('migrate-zosversion script', function(accounts) {
  const [_, owner, newAdmin, anotherAdmin] = accounts.map(utils.toChecksumAddress);
  const EMPTY_INITIALIZATION_DATA = Buffer.from('');
  const network = 'test';
  const txParams = { from: owner };

  before(async function() {
    this.contentURI = '0x20'
    this.version = '1.1.0';
    this.packageName = 'Herbs';
  });

  beforeEach('initialize environment for zosversion2', async function() {
    // set package and network file
    const packageFile = new ZosPackageFile('test/mocks/packages/package-with-zosversion-2.zos.json');
    packageFile.publish = false;
    this.networkFile = packageFile.networkFile(network);
    this.networkFile.zosversion = '2';
  });

  const addProxies = function() {
    this.networkFile.addProxy(this.packageName, 'ImplV1', {
      address: this.implV1Proxy.address,
      version: this.version,
      implementation: this.implV1.address
    });

    this.networkFile.addProxy(this.packageName, 'ImplV2', {
      address: this.implV2Proxy.address,
      version: this.version,
      implementation: this.implV2.address,
      admin: anotherAdmin
    });
  };

  const behavesLikeMigration = function(newAdmin) {
    it('modifies network file', async function() {
      this.networkFile.proxyAdminAddress.should.not.be.null;
    });

    it('updates zosVersion', function() {
      this.networkFile.zosversion.should.eq('2.2');
    });

    it('changes admin of owned proxy', async function() {
      (await Proxy.at(this.implV1Proxy.address).admin()).should.eq(newAdmin || this.networkFile.proxyAdminAddress);
    })

    it('does not change admin of not owned proxy', async function() {
      (await Proxy.at(this.implV2Proxy.address).admin()).should.eq(anotherAdmin);
    });
  };

  context('for unpublished project', function() {
    beforeEach('initialize proxies manually', async function() {
      await push({ network, txParams, networkFile: this.networkFile });
      this.implV1 = this.networkFile.contract('ImplV1');
      this.implV2 = this.networkFile.contract('ImplV2');
      this.implV1Proxy = await Proxy.deploy(this.implV1.address, owner, EMPTY_INITIALIZATION_DATA, txParams);
      this.implV2Proxy = await Proxy.deploy(this.implV2.address, anotherAdmin, EMPTY_INITIALIZATION_DATA, txParams);
    });

    beforeEach('manually add proxies to network file', addProxies)

    describe('scripts', function() {
      describe('publish', function() {
        beforeEach('publish project', async function() {
          await publish({ network, txParams, networkFile: this.networkFile });
        });

        behavesLikeMigration();
      });

      describe('create', function() {
        beforeEach('create proxy', async function() {
          this.newProxy = await create({ contractAlias: 'ImplV1', network, txParams, networkFile: this.networkFile });
        });

        it('creates the proxy assigning proxyAdmin address as admin', async function() {
          (await Proxy.at(this.newProxy.address).admin()).should.eq(this.networkFile.proxyAdminAddress);
        });

        it('adds the proxy to networkfile', async function() {
          this.networkFile.getProxy(this.newProxy.address).should.not.be.null;
        });

        behavesLikeMigration();
      });

      describe('update', function() {
        beforeEach('update proxy', async function() {
          await update({ contractAlias: 'ImplV1', proxyAddress: this.implV1Proxy.address, network, txParams, networkFile: this.networkFile });
        });

        behavesLikeMigration();
      });

      describe('set-admin', function() {
        beforeEach('set admin', async function() {
          await setAdmin({ proxyAddress: this.implV1Proxy.address, newAdmin, network, txParams, networkFile: this.networkFile });
        });

        behavesLikeMigration(newAdmin);
      });
    });
  });

  context('for published project', function() {
    beforeEach('simulates a zosversion 2 project', async function() {
      await push({ network, txParams, networkFile: this.networkFile });
      this.implV1 = this.networkFile.contract('ImplV1');
      this.implV2 = this.networkFile.contract('ImplV2');
      this.directory = await ImplementationDirectory.new({ from: owner });
      await this.directory.methods.setImplementation('ImplV1', this.implV1.address).send({ from: owner });
      await this.directory.methods.setImplementation('ImplV2', this.implV2.address).send({ from: owner });
      this.package = await Package.new({ from: owner });
      await this.package.methods.addVersion(toSemanticVersion(this.version), this.directory.address, this.contentURI).send({ from: owner });
      this.app = await DeprecatedApp.new({ from: owner });
      await this.app.methods.setPackage(this.packageName, this.package.address, toSemanticVersion(this.version)).send({ from: owner });
      this.networkFile.app = { address: this.app.address };
      this.networkFile.package = { address: this.package.address };
      this.networkFile.provider = { address: this.directory.address };
    });

    beforeEach('initialize proxies manually', async function() {
      const { events: eventsV1Proxy } = await this.app.methods.create(this.packageName, 'ImplV1', EMPTY_INITIALIZATION_DATA).send({ from: owner });
      const { events: eventsV2Proxy } = await this.app.methods.create(this.packageName, 'ImplV2', EMPTY_INITIALIZATION_DATA).send({ from: owner });
      this.implV1Proxy = await Proxy.at(eventsV1Proxy['ProxyCreated'].returnValues.proxy, txParams);
      this.implV2Proxy = await Proxy.at(eventsV2Proxy['ProxyCreated'].returnValues.proxy, txParams);
      await this.app.methods.changeProxyAdmin(this.implV2Proxy.address, anotherAdmin).send({ from: owner });
    });

    beforeEach('manually add proxies to network file', addProxies)

    describe('scripts', function() {
      describe('create', function() {
        beforeEach('creates proxy', async function() {
          this.newProxy = await create({ contractAlias: 'ImplV1', network, txParams: { from: owner }, networkFile: this.networkFile });
        });

        it('creates the proxy assigning proxyAdmin address as admin', async function() {
          (await Proxy.at(this.newProxy.address).admin()).should.eq(this.networkFile.proxyAdminAddress);
        });

        it('adds the proxy to networkfile', async function() {
          this.networkFile.getProxy(this.newProxy.address).should.not.be.null;
        });

        behavesLikeMigration();
      });

      describe('update', function() {
        beforeEach('update proxy', async function() {
          await update({ contractAlias: 'ImplV1', proxyAddress: this.implV1Proxy.address, network, txParams, networkFile: this.networkFile });
        });

        behavesLikeMigration();
      });

      describe('set admin', function() {
        beforeEach('set admin', async function() {
          await setAdmin({ proxyAddress: this.implV1Proxy.address, newAdmin, network, txParams, networkFile: this.networkFile });
        });

        behavesLikeMigration(newAdmin);
      });
    });
  });
});
