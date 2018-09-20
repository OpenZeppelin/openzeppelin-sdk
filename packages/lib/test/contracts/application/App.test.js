'use strict';
require('../../setup')

import Contracts from '../../../src/utils/Contracts'
import shouldManageProxies from './ManageProxies.behavior';
import shouldManagePackages from './ManagePackages.behavior';
import shouldBehaveLikeOwnable from '../../../src/test/behaviors/Ownable';

const Package = Contracts.getFromLocal('Package')
const ImplementationDirectory = Contracts.getFromLocal('ImplementationDirectory')
const AppContract = Contracts.getFromLocal('App')
const DummyImplementation = Contracts.getFromLocal('DummyImplementation')
const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2')

contract('App', (accounts) => {
  const [_, appOwner, packageOwner, directoryOwner, anotherAccount] = accounts;

  const version_0 = 'version_0'
  const version_1 = 'version_1'

  before("initializing dummy implementations", async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementationV2.new()).address
  })

  beforeEach("initializing app", async function () {
    this.contractName = 'ERC721';
    this.contractNameUpdated = 'ERC721Updated';
    this.packageName = 'MyProject';

    this.directory = await ImplementationDirectory.new({ from: directoryOwner })
    await this.directory.setImplementation(this.contractName, this.implementation_v0, { from: directoryOwner })
    await this.directory.setImplementation(this.contractNameUpdated, this.implementation_v1, { from: directoryOwner })

    this.package = await Package.new({ from: packageOwner })
    await this.package.addVersion(version_0, this.directory.address, { from: packageOwner });

    this.app = await AppContract.new({ from: appOwner })
    await this.app.setPackage(this.packageName, this.package.address, version_0, { from: appOwner });
  })

  describe('ownership', function () {
    beforeEach("setting ownable", function () {
      this.ownable = this.app
    })
    shouldBehaveLikeOwnable(appOwner, anotherAccount)
  })

  shouldManageProxies(accounts);
  shouldManagePackages(accounts);
})
