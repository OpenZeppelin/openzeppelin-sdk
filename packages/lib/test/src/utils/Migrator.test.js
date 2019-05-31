'use strict';

require('../../setup');
import utils from 'web3-utils';

import Contracts from '../../../src/artifacts/Contracts';
import migrate from '../../../src/utils/Migrator';
import assertRevert from '../../../src/test/helpers/assertRevert';
import { toSemanticVersion } from '../../../src/utils/Semver';

const Package = Contracts.getFromLocal('Package');
const DeprecatedApp = Contracts.getFromLocal('DeprecatedApp');
const Proxy = Contracts.getFromLocal('DeprecatedAdminUpgradeabilityProxy');
const ImplementationDirectory = Contracts.getFromLocal(
  'ImplementationDirectory',
);
const ImplV1 = Contracts.getFromLocal('DummyImplementation');

contract('migrator', function(accounts) {
  const [
    _,
    owner,
    proxyAdminAddress,
    anotherAccount,
    anotherAddress,
  ] = accounts.map(utils.toChecksumAddress);
  const EMPTY_INITIALIZATION_DATA = Buffer.from('');

  before('initialize logic contracts', async function() {
    this.contentURI = '0x20';
    this.version = '0.0.1';
    this.contractName = 'ERC721';
    this.packageName = 'MyProject';
    this.implV1 = (await ImplV1.new()).address;
  });

  beforeEach('initializing', async function() {
    this.directory = await ImplementationDirectory.new({ from: owner });
    await this.directory.methods
      .setImplementation(this.contractName, this.implV1)
      .send({ from: owner });
    this.package = await Package.new({ from: owner });
    await this.package.methods
      .addVersion(
        toSemanticVersion(this.version),
        this.directory.address,
        this.contentURI,
      )
      .send({ from: owner });
    this.app = await DeprecatedApp.new({ from: owner });
    await this.app.methods
      .setPackage(
        this.packageName,
        this.package.address,
        toSemanticVersion(this.version),
      )
      .send({ from: owner });
    const { events } = await this.app.methods
      .create(this.packageName, this.contractName, EMPTY_INITIALIZATION_DATA)
      .send({ from: owner });
    this.proxyAddress = events['ProxyCreated'].returnValues.proxy;
  });

  describe('migrate proxy function', function() {
    context('with valid owner', function() {
      it('changes the proxy admin', async function() {
        await migrate(this.app.address, this.proxyAddress, proxyAdminAddress, {
          from: owner,
        });
        (await this.app.methods
          .getProxyAdmin(this.proxyAddress)
          .call()).should.eq(proxyAdminAddress);
      });
    });

    context('with invalid owner', function() {
      it('reverts migration', async function() {
        await assertRevert(
          migrate(this.app.address, this.proxyAddress, proxyAdminAddress, {
            from: anotherAccount,
          }),
        );
      });
    });

    context('with invalid proxy address', function() {
      it('reverts migration', async function() {
        await assertRevert(
          migrate(this.app.address, anotherAddress, proxyAdminAddress, {
            from: owner,
          }),
        );
      });
    });
  });
});
