'use strict';
require('../../setup');

import Proxy from '../../../src/proxy/Proxy';
import Contracts from '../../../src/artifacts/Contracts';
import { toAddress } from '../../../src/utils/Addresses';
import { signDeploy, signer } from '../../../src/test/helpers/signing';
import { random } from 'lodash';
import MinimalProxy from '../../../src/proxy/MinimalProxy';

const Impl = Contracts.getFromLocal('Impl');
const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2');

export default function shouldManageProxies({ otherAdmin, setImplementations, supportsNames }) {
  describe('proxies', function() {
    describe('createProxy', function() {
      beforeEach('setting implementations', setImplementations);

      it('creates a proxy given contract class', async function() {
        const instance = await this.project.createProxy(DummyImplementation);
        await assertIsVersion(instance, 'V1');
        await assertIsProxy(instance, this.adminAddress);
      });

      it('creates a proxy with different admin', async function() {
        const instance = await this.project.createProxy(DummyImplementation, {
          admin: otherAdmin,
        });
        await assertIsVersion(instance, 'V1');
        await assertIsProxy(instance, otherAdmin);
      });

      if (supportsNames) {
        it('creates a proxy given contract name', async function() {
          const instance = await this.project.createProxy(Impl, {
            contractName: 'DummyImplementation',
          });
          await assertIsVersion(instance, 'V1');
          await assertIsProxy(instance, this.adminAddress);
        });
      }

      it('creates and initializes a proxy', async function() {
        const instance = await this.project.createProxy(DummyImplementation, {
          initArgs: [10, 'foo', [20, 30]],
        });
        await assertIsVersion(instance, 'V1');
        await assertIsProxy(instance, this.adminAddress);
        (await instance.methods.value().call()).should.eq('10');
      });
    });

    describe('createMinimalProxy', function() {
      beforeEach('setting implementations', setImplementations);

      it('creates a proxy given contract class', async function() {
        const instance = await this.project.createMinimalProxy(DummyImplementation);
        await assertIsVersion(instance, 'V1');
        await assertIsMinimalProxy(instance);
      });

      it('creates and initializes a proxy', async function() {
        const instance = await this.project.createMinimalProxy(DummyImplementation, {
          initArgs: [10, 'foo', [20, 30]],
        });
        await assertIsVersion(instance, 'V1');
        await assertIsMinimalProxy(instance);
        (await instance.methods.value().call()).should.eq('10');
      });
    });

    describe('createProxyWithSalt', function() {
      beforeEach('setting implementations', setImplementations);
      beforeEach('generating salt', function() {
        this.salt = random(0, 2 ** 32);
      });
      beforeEach('predicting deployment address', async function() {
        this.deploymentAddress = await this.project.getProxyDeploymentAddress(this.salt);
      });

      it('creates a proxy given contract class and salt', async function() {
        const instance = await this.project.createProxyWithSalt(DummyImplementation, this.salt);
        await assertIsVersion(instance, 'V1');
        await assertIsProxy(instance, this.adminAddress);
        instance.address.should.equalIgnoreCase(this.deploymentAddress);
      });

      it('creates a proxy with different admin', async function() {
        const instance = await this.project.createProxyWithSalt(DummyImplementation, this.salt, null, {
          admin: otherAdmin,
        });
        await assertIsVersion(instance, 'V1');
        await assertIsProxy(instance, otherAdmin);
        instance.address.should.equalIgnoreCase(this.deploymentAddress);
      });

      it('creates a proxy using signer instead of sender', async function() {
        if (!this.implementationV1) return; // If the implementation has not been pre-registered in this suite, bail
        const implementation = this.implementationV1.address;
        const factory = await this.project.ensureProxyFactory();
        const signature = signDeploy(factory.address, this.salt, implementation, otherAdmin);
        const deploymentAddress = await this.project.getProxyDeploymentAddress(this.salt, signer);
        const instance = await this.project.createProxyWithSalt(DummyImplementation, this.salt, signature, {
          admin: otherAdmin,
        });
        await assertIsVersion(instance, 'V1');
        await assertIsProxy(instance, otherAdmin);
        instance.address.should.equalIgnoreCase(deploymentAddress);
      });

      if (supportsNames) {
        it('creates a proxy given contract name', async function() {
          const instance = await this.project.createProxyWithSalt(Impl, this.salt, null, {
            contractName: 'DummyImplementation',
          });
          await assertIsVersion(instance, 'V1');
          await assertIsProxy(instance, this.adminAddress);
          instance.address.should.equalIgnoreCase(this.deploymentAddress);
        });
      }

      it('creates and initializes a proxy', async function() {
        const instance = await this.project.createProxyWithSalt(DummyImplementation, this.salt, null, {
          initArgs: [10, 'foo', [20, 30]],
        });
        await assertIsVersion(instance, 'V1');
        await assertIsProxy(instance, this.adminAddress);
        (await instance.methods.value().call()).should.eq('10');
        instance.address.should.equalIgnoreCase(this.deploymentAddress);
      });
    });

    describe('upgradeProxy', function() {
      beforeEach('setting implementations', setImplementations);
      beforeEach('create proxy', createProxy);

      it('upgrades a proxy given contract class', async function() {
        const upgraded = await this.project.upgradeProxy(this.instance.address, DummyImplementationV2);
        await assertIsVersion(upgraded, 'V2');
        await assertIsProxy(upgraded, this.adminAddress);
      });

      if (supportsNames) {
        it('upgrades a proxy given contract name', async function() {
          const upgraded = await this.project.upgradeProxy(this.instance.address, Impl, {
            contractName: 'DummyImplementationV2',
          });
          await assertIsVersion(upgraded, 'V2');
          await assertIsProxy(upgraded, this.adminAddress);
        });
      }

      it('upgrades and migrates a proxy', async function() {
        const upgraded = await this.project.upgradeProxy(this.instance.address, DummyImplementationV2, {
          initMethod: 'migrate',
          initArgs: [20],
          initFrom: otherAdmin,
        });
        await assertIsVersion(upgraded, 'V2');
        await assertIsProxy(upgraded, this.adminAddress);
        (await upgraded.methods.value().call()).should.eq('20');
      });
    });

    describe('changeProxyAdmin', function() {
      beforeEach('setting implementations', setImplementations);
      beforeEach('create proxy', createProxy);

      it('changes admin of a proxy', async function() {
        await this.project.changeProxyAdmin(this.instance.address, otherAdmin);
        await assertIsProxy(this.instance, otherAdmin);
      });
    });
  });

  async function assertIsMinimalProxy(address) {
    const proxy = MinimalProxy.at(toAddress(address));
    (await proxy.implementation()).should.be.nonzeroAddress;
  }

  async function assertIsProxy(address, adminAddress) {
    const proxy = Proxy.at(toAddress(address));
    (await proxy.implementation()).should.be.nonzeroAddress;
    (await proxy.admin()).should.eq(adminAddress, 'Admin address does not match');
  }

  async function assertIsVersion(instance, expected) {
    const actual = await instance.methods.version().call();
    actual.should.eq(expected);
  }

  async function createProxy() {
    this.instance = await this.project.createProxy(DummyImplementation);
  }
}
