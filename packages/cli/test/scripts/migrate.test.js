'use strict'
require('../setup')

import utils from 'web3-utils';
import { App, Package, ImplementationDirectory, Proxy, ProxyAdmin, Contracts, toSemanticVersion, assertRevert } from 'zos-lib'

import push from '../../src/scripts/push';
import create from '../../src/scripts/create';
import update from '../../src/scripts/update';
import publish from '../../src/scripts/publish';
import setAdmin from '../../src/scripts/set-admin';
import ZosPackageFile from '../../src/models/files/ZosPackageFile';

const should = require('chai').should();

const Package = Contracts.getFromLib('Package');
const DeprecatedApp = Contracts.getFromLib('DeprecatedApp');
const ProxyContract = Contracts.getFromLib('DeprecatedAdminUpgradeabilityProxy');
const ImplementationDirectory = Contracts.getFromLib('ImplementationDirectory');

contract('migrate-version script', function(accounts) {
  accounts = accounts.map(utils.toChecksumAddress);
  const [_skipped, owner, newAdmin, anotherNewAdmin, anotherAccount, yetAnotherAccount] = accounts;
  const EMPTY_INITIALIZATION_DATA = Buffer.from('');
  const network = 'test';
  const txParams = { from: owner };
  const defaultVersion = '1.1.0';
  const projectName = 'Herbs';
  const contractAlias = 'Impl';
  const dependencyName = 'mock-stdlib-undeployed';

  before(async function() {
    this.contentURI = '0x20'
    this.version = '0.0.1';
    this.contractName = 'ERC721';
    this.packageName = 'MyProject';
  });

  beforeEach('initialize environment for zosversion2', async function() {
    // set package and network file
    const packageFile = new ZosPackageFile('test/mocks/packages/package-with-zosversion-2.zos.json');
    packageFile.publish = false;
    this.networkFile = packageFile.networkFile(network);
    this.networkFile.zosversion = '2';
    await push({ network, txParams, networkFile: this.networkFile, deployDependencies: true });
    // manually create proxies
    this.implV1 = this.networkFile.contract('ImplV1');
    this.implV2 = this.networkFile.contract('ImplV2');
  });

  beforeEach('initialize proxies manually', async function() {
    this.implV1Proxy = await Proxy.deploy(this.implV1.address, owner, EMPTY_INITIALIZATION_DATA, this.txParams);
    this.implV2Proxy = await Proxy.deploy(this.implV2.address, yetAnotherAccount, EMPTY_INITIALIZATION_DATA, this.txParams);
    //manually add proxies to network file
    this.networkFile.addProxy(this.packageName, this.contractName, {
      address: this.implV1Proxy.address,
      version: defaultVersion,
      implementation: this.implV1.address
    });

    this.networkFile.addProxy(this.packageName, this.contractName, {
      address: this.implV2Proxy.address,
      version: defaultVersion,
      implementation: this.implV2.address,
      admin: yetAnotherAccount
    });
  });
 
  const behavesLikeMigration = function(newAdmin) {
    it('should modify network file', async function() {
      this.networkFile.proxyAdminAddress.should.not.be.null;
    });

    it('should update zosVersion', function() {
      this.networkFile.zosversion.should.eq('2.2');
    });

    it('should change admin of owned proxy', async function() {
      (await Proxy.at(this.implV1Proxy.address).admin()).should.eq(newAdmin || this.networkFile.proxyAdminAddress);
    })

    it('should not change admin of not owned proxy', async function() {
      (await Proxy.at(this.implV2Proxy.address).admin()).should.eq(yetAnotherAccount);
    });
  };

  context('for unpublished project', function() {
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

  context.skip('for published project', function() {
    beforeEach('setup networkFile with old App version', async function() {
      this.directory = await ImplementationDirectory.new({ from: owner });
      await this.directory.methods.setImplementation(this.contractName, this.implV1).send({ from: owner });
      this.package = await Package.new({ from: owner });
      await this.package.methods.addVersion(toSemanticVersion(this.version), this.directory.address, this.contentURI).send({ from: owner });
      this.app = await DeprecatedApp.new({ from: owner });
      await this.app.methods.setPackage(this.packageName, this.package.address, toSemanticVersion(this.version)).send({ from: owner });
      const { events } = await this.app.methods.create(this.packageName, this.contractName, EMPTY_INITIALIZATION_DATA).send({ from: owner });
      this.proxyAddress = events['ProxyCreated'].returnValues.proxy;
    });
  });
});
