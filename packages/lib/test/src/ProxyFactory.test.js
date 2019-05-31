'use strict';
require('../setup');

import utils from 'web3-utils';
import Contracts from '../../src/artifacts/Contracts';
import assertRevert from '../../src/test/helpers/assertRevert';
import ProxyFactory from '../../src/proxy/ProxyFactory';
import { signDeploy, signer } from '../../src/test/helpers/signing';
import ZWeb3 from '../../src/artifacts/ZWeb3';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

function behavesLikeCreate2ProxyFactory(accounts, user, createProxy) {
  const [_, admin, anotherAdmin, anotherFrom] = accounts.map(
    utils.toChecksumAddress,
  );

  const salt1 = '2';
  const salt2 = '4';
  const salt3 = '8';

  it('creates a proxy', async function() {
    const proxy = await createProxy(
      this.factory,
      salt1,
      this.implementationV1.address,
      admin,
    );
    (await proxy.implementation()).should.be.equalIgnoreCase(
      this.implementationV1.address,
      'Logic contract address does not match',
    );
    (await proxy.admin()).should.be.equalIgnoreCase(
      admin,
      'Admin address does not match',
    );
  });

  it('initializes the created instance', async function() {
    const initData = this.implementationV1.methods
      .initialize(10, 'foo', [20, 30])
      .encodeABI();
    const proxy = await createProxy(
      this.factory,
      salt1,
      this.implementationV1.address,
      admin,
      initData,
    );
    const impl = await ImplV1.at(proxy.address);
    (await impl.methods.value().call()).should.eq('10');
    (await impl.methods.text().call()).should.eq('foo');
  });

  it('predicts deployment address', async function() {
    const predicted = await this.factory.getDeploymentAddress(salt1, user);
    const proxy = await createProxy(
      this.factory,
      salt1,
      this.implementationV1.address,
      admin,
    );
    proxy.address.should.be.equalIgnoreCase(
      predicted,
      'Predicted address does not match',
    );
  });

  it('deploys two proxies with the same salt and different sender', async function() {
    await createProxy(
      this.factory,
      salt1,
      this.implementationV1.address,
      admin,
    );
    const factory2 = await ProxyFactory.fetch(this.factory.address, {
      from: anotherFrom,
    });
    await factory2.createProxy(salt1, this.implementationV1.address, admin);
  });

  it('deploys two proxies with the different salt and same sender', async function() {
    await createProxy(
      this.factory,
      salt1,
      this.implementationV1.address,
      admin,
    );
    await createProxy(
      this.factory,
      salt2,
      this.implementationV1.address,
      admin,
    );
  });

  it('cannot deploy two proxies with the same salt and sender', async function() {
    await createProxy(
      this.factory,
      salt1,
      this.implementationV1.address,
      admin,
    );
    await assertRevert(
      createProxy(
        this.factory,
        salt1,
        this.implementationV2.address,
        anotherAdmin,
      ),
    );
  });

  it('keeps deployment address while factory creates other proxies', async function() {
    const predicted = await this.factory.getDeploymentAddress(salt1, user);
    await createProxy(
      this.factory,
      salt2,
      this.implementationV1.address,
      admin,
    );
    await createProxy(
      this.factory,
      salt3,
      this.implementationV1.address,
      admin,
    );
    const factory2 = await ProxyFactory.fetch(this.factory.address, {
      from: anotherFrom,
    });
    await factory2.createProxy(salt1, this.implementationV1.address, admin);

    const newPredicted = await this.factory.getDeploymentAddress(salt1, user);
    newPredicted.should.equalIgnoreCase(
      predicted,
      'Predicted address changed inbetween deployments',
    );

    const proxy = await createProxy(
      this.factory,
      salt1,
      this.implementationV1.address,
      admin,
    );
    proxy.address.should.be.equalIgnoreCase(
      predicted,
      'Predicted address does not match',
    );
  });
}

contract('ProxyFactory model', function(accounts) {
  const sender = utils.toChecksumAddress(accounts[5]);

  before('set implementations', async function() {
    this.implementationV1 = await ImplV1.new();
    this.implementationV2 = await ImplV2.new();
  });

  beforeEach('create factory', async function() {
    this.factory = await ProxyFactory.deploy({ from: sender });
  });

  describe('#deploy', function() {
    behavesLikeCreate2ProxyFactory(
      accounts,
      sender,
      async (factory, ...args) => {
        return factory.createProxy(...args);
      },
    );
  });

  describe('#deploySigned', function() {
    it('retrieves signer address', async function() {
      const salt = '16';
      const logic = this.implementationV1.address;
      const admin = signer;
      const initData = '0x01020304';
      const signature = signDeploy(
        this.factory.address,
        salt,
        logic,
        admin,
        initData,
      );
      const actualSigner = await this.factory.getSigner(
        salt,
        logic,
        admin,
        initData,
        signature,
      );
      actualSigner.should.eq(signer);
    });

    behavesLikeCreate2ProxyFactory(
      accounts,
      signer,
      async (factory, ...args) => {
        const createArgs = args.length === 3 ? [...args, ''] : args; // append empty initdata if not supplied
        return factory.createProxy(
          ...createArgs,
          signDeploy(factory.address, ...createArgs),
        );
      },
    );
  });

  describe('#deployMinimal', function() {
    it('deploys minimal proxy', async function() {
      const proxy = await this.factory.createMinimalProxy(
        this.implementationV1.address,
      );
      const impl = await ImplV1.at(proxy.address);
      (await impl.methods.version().call()).should.eq('V1');
    });

    it('deploys and initializes minimal proxy', async function() {
      const initData = this.implementationV1.methods
        .initialize(10, 'foo', [20, 30])
        .encodeABI();
      const proxy = await this.factory.createMinimalProxy(
        this.implementationV1.address,
        initData,
      );
      const impl = await ImplV1.at(proxy.address);
      (await impl.methods.version().call()).should.eq('V1');
      (await impl.methods.value().call()).should.eq('10');
      (await impl.methods.text().call()).should.eq('foo');
    });

    it('reverts on minimal proxy deploy', async function() {
      // ImplV1 does not have a migrate method, so it should revert
      const initData = this.implementationV2.methods.migrate(10).encodeABI();
      await assertRevert(
        this.factory.createMinimalProxy(
          this.implementationV1.address,
          initData,
        ),
      );
    });

    it('reports implementation address', async function() {
      const proxy = await this.factory.createMinimalProxy(
        this.implementationV1.address,
      );
      const impl = await proxy.implementation();
      impl.should.equalIgnoreCase(this.implementationV1.address);
    });
  });
});
