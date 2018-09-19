'use strict'
require('../../setup')

import Proxy from '../../../src/proxy/Proxy';
import Contracts from '../../../src/utils/Contracts';
import { toAddress } from '../../../src/utils/Addresses';

const Impl = Contracts.getFromLocal('Impl');
const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2');

export default function shouldManageProxies({ otherAdmin, setImplementations, supportsNames }) {

  describe('like a proxy managing project', function () {
    describe('createProxy', function () {
      beforeEach('setting implementations', setImplementations);

      it('creates a proxy given contract class', async function () {
        const instance = await this.project.createProxy(DummyImplementation);
        await assertIsVersion(instance, 'V1');
        await assertIsProxy(instance, this.adminAddress);
      })

      if (supportsNames) {
        it('creates a proxy given contract name', async function () {
          const instance = await this.project.createProxy(Impl, { contractName: 'DummyImplementation' });
          await assertIsVersion(instance, 'V1');
          await assertIsProxy(instance, this.adminAddress);
        })
      }

      it('creates and initializes a proxy', async function () {
        const instance = await this.project.createProxy(DummyImplementation, { initMethod: 'initializeNonPayable', initArgs: [10] });
        await assertIsVersion(instance, 'V1');
        await assertIsProxy(instance, this.adminAddress);
        (await instance.value()).toNumber().should.eq(10)
      })
    })

    describe('upgradeProxy', function () {
      beforeEach('setting implementations', setImplementations);
      beforeEach('create proxy', createProxy);

      it('upgrades a proxy given contract class', async function () {
        const upgraded = await this.project.upgradeProxy(this.instance.address, DummyImplementationV2);
        await assertIsVersion(upgraded, 'V2');
        await assertIsProxy(upgraded, this.adminAddress);
      })

      if (supportsNames) {
        it('upgrades a proxy given contract name', async function () {
          const upgraded = await this.project.upgradeProxy(this.instance.address, Impl, { contractName: 'DummyImplementationV2' });
          await assertIsVersion(upgraded, 'V2');
          await assertIsProxy(upgraded, this.adminAddress);
        })
      }

      it('upgrades and migrates a proxy', async function () {
        const upgraded = await this.project.upgradeProxy(this.instance.address, DummyImplementationV2, { initMethod: 'migrate', initArgs: [20], initFrom: otherAdmin });
        await assertIsVersion(upgraded, 'V2');
        await assertIsProxy(upgraded, this.adminAddress);
        (await upgraded.value()).toNumber().should.eq(20)
      })
    })

    describe('changeProxyAdmin', function () {
      beforeEach('setting implementations', setImplementations);
      beforeEach('create proxy', createProxy);

      it('changes admin of a proxy', async function () {
        await this.project.changeProxyAdmin(this.instance.address, otherAdmin);
        await assertIsProxy(this.instance, otherAdmin)
      })
    });
  });

  async function assertIsProxy(address, adminAddress) {
    const proxy = Proxy.at(toAddress(address));
    (await proxy.implementation()).should.be.nonzeroAddress;
    (await proxy.admin()).should.eq(adminAddress);
  }
  
  async function assertIsVersion(instance, expected) {
    const actual = await instance.version();
    actual.should.eq(expected);
  }

  async function createProxy () {
    this.instance = await this.project.createProxy(DummyImplementation);
  };
}







