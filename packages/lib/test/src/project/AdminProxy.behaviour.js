'use strict';
require('../../setup');

import Proxy from '../../../src/proxy/Proxy';
import Contracts from '../../../src/artifacts/Contracts';
import { toAddress } from '../../../src/utils/Addresses';

const Impl = Contracts.getFromLocal('Impl');
const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2');

export default function shouldManageAdminProxy({ otherAdmin, setImplementations }) {
  describe('proxyAdmin', function() {
    describe('transferAdminOwnership', function() {
      beforeEach('setting implementations', setImplementations);
      beforeEach('create proxy', createProxy);

      it('transfers owneship of a proxy admin to a new owner', async function() {
        await this.project.transferAdminOwnership(otherAdmin);
        const owner = await this.project.proxyAdmin.getOwner();
        owner.should.be.equal(otherAdmin);
      });
    });
  });

  async function createProxy() {
    this.instance = await this.project.createProxy(DummyImplementation);
  }
}
