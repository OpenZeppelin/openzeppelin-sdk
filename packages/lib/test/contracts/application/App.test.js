'use strict';
require('../../setup');

import Contracts from '../../../src/artifacts/Contracts';
import shouldManageProxies from './ManageProxies.behavior';
import shouldManagePackages from './ManagePackages.behavior';
import shouldBehaveLikeOwnable from '../../../src/test/behaviors/Ownable';
import { toSemanticVersion } from '../../../src/utils/Semver';
import utils from 'web3-utils';

const Package = Contracts.getFromLocal('Package');
const ImplementationDirectory = Contracts.getFromLocal(
  'ImplementationDirectory',
);
const AppContract = Contracts.getFromLocal('App');
const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2');

contract('App', accounts => {
  accounts = accounts.map(utils.toChecksumAddress); // Required by Web3 v1.x.

  const [_, appOwner, packageOwner, directoryOwner, anotherAccount] = accounts;

  // eslint-disable-next-line @typescript-eslint/camelcase
  const version_0 = '1.0.0';
  // eslint-disable-next-line @typescript-eslint/camelcase
  const version_1 = '1.1.0';
  const contentURI = '0x10';

  before('initializing dummy implementations', async function() {
    // eslint-disable-next-line @typescript-eslint/camelcase
    this.implementation_v0 = (await DummyImplementation.new()).address;
    // eslint-disable-next-line @typescript-eslint/camelcase
    this.implementation_v1 = (await DummyImplementationV2.new()).address;
  });

  beforeEach('initializing app', async function() {
    this.contractName = 'ERC721';
    this.contractNameUpdated = 'ERC721Updated';
    this.packageName = 'MyProject';
    this.directory = await ImplementationDirectory.new({
      from: directoryOwner,
    });
    await this.directory.methods
      .setImplementation(this.contractName, this.implementation_v0)
      .send({ from: directoryOwner });
    await this.directory.methods
      .setImplementation(this.contractNameUpdated, this.implementation_v1)
      .send({ from: directoryOwner });
    this.package = await Package.new({ from: packageOwner });
    await this.package.methods
      .addVersion(
        toSemanticVersion(version_0),
        this.directory.address,
        contentURI,
      )
      .send({ from: packageOwner });
    this.app = await AppContract.new({ from: appOwner });
    await this.app.methods
      .setPackage(
        this.packageName,
        this.package.address,
        toSemanticVersion(version_0),
      )
      .send({ from: appOwner });
  });

  describe('ownership', function() {
    beforeEach('setting ownable', function() {
      this.ownable = this.app;
    });
    shouldBehaveLikeOwnable(appOwner, anotherAccount);
  });

  shouldManageProxies(accounts);
  shouldManagePackages(accounts);
});
