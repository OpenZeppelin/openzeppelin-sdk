'use strict';
require('../../setup')

import Proxy from '../../../src/proxy/Proxy'
import ZWeb3 from '../../../src/artifacts/ZWeb3'
import encodeCall from '../../../src/helpers/encodeCall'
import assertRevert from '../../../src/test/helpers/assertRevert'
import shouldBehaveLikeUpgradeabilityProxy from './UpgradeabilityProxy.behaviour'
import BN from 'bignumber.js'
import Contracts from '../../../src/artifacts/Contracts'
import { ZERO_ADDRESS } from '../../../src/utils/Addresses';

const Implementation1 = Contracts.getFromLocal('Implementation1');
const Implementation2 = Contracts.getFromLocal('Implementation2');
const Implementation3 = Contracts.getFromLocal('Implementation3');
const Implementation4 = Contracts.getFromLocal('Implementation4');
const MigratableMockV1 = Contracts.getFromLocal('MigratableMockV1')
const MigratableMockV2 = Contracts.getFromLocal('MigratableMockV2')
const MigratableMockV3 = Contracts.getFromLocal('MigratableMockV3')
const InitializableMock = Contracts.getFromLocal('InitializableMock')
const DummyImplementation = Contracts.getFromLocal('DummyImplementation')
const ClashingImplementation = Contracts.getFromLocal('ClashingImplementation')
const AdminUpgradeabilityProxy = Contracts.getFromLocal('AdminUpgradeabilityProxy')

const sendTransaction = (target, method, args, values, opts) => {
  const data = encodeCall(method, args, values);
  return ZWeb3.sendTransaction({ ... opts, to: target.address, data });
};

export default function shouldBehaveLikeAdminUpgradeabilityProxy(createProxy, accounts) {
  const [_, proxyAdminAddress, proxyAdminOwner, anotherAccount] = accounts;

  before(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
  })

  beforeEach(async function () {
    const initializeData = Buffer.from('');
    this.proxy = await createProxy(this.implementation_v0, proxyAdminAddress, initializeData, { from: proxyAdminOwner });
    this.proxyAddress = this.proxy.address;
  })

  describe('implementation', function () {
    it('returns the current implementation address', async function () {
      const implementation = await this.proxy.methods.implementation().call({ from: proxyAdminAddress })

      implementation.should.be.equal(this.implementation_v0)
    })

    it('delegates to the implementation', async function () {
      const dummy = await DummyImplementation.at(this.proxyAddress);
      const value = await dummy.methods.get().call();

      value.should.be.true
    })
  })

  describe('upgradeTo', function () {
    describe('when the sender is the admin', function () {
      const from = proxyAdminAddress

      describe('when the given implementation is different from the current one', function () {
        it('upgrades to the requested implementation', async function () {
          await this.proxy.methods.upgradeTo(this.implementation_v1).send({ from })

          const implementation = await this.proxy.methods.implementation().call({ from: proxyAdminAddress })
          implementation.should.be.equal(this.implementation_v1)
        })

        it('emits an event', async function () {
          const { events } = await this.proxy.methods.upgradeTo(this.implementation_v1).send({ from })
          events.should.have.key("Upgraded")
          events["Upgraded"].returnValues.implementation.should.be.equal(this.implementation_v1)
        })
      })

      describe('when the given implementation is the zero address', function () {
        it('reverts', async function () {
          await assertRevert(this.proxy.methods.upgradeTo(ZERO_ADDRESS).send({ from }))
        })
      })
    })

    describe('when the sender is not the admin', function () {
      const from = anotherAccount

      it('reverts', async function () {
        await assertRevert(this.proxy.methods.upgradeTo(this.implementation_v1).send({ from }))
      })
    })
  })

  describe('upgradeToAndCall', function () {
    describe('without migrations', function () {
      beforeEach(async function () {
        this.behavior = await InitializableMock.new()
      })

      describe('when the call does not fail', function () {
        const initializeData = encodeCall('initializeWithX', ['uint256'], [42])

        describe('when the sender is the admin', function () {
          const from = proxyAdminAddress
          const value = 1e5

          beforeEach(async function () {
            this.events = (await this.proxy.methods.upgradeToAndCall(this.behavior.address, initializeData).send({ from, value })).events
          })

          it('upgrades to the requested implementation', async function () {
            const implementation = await this.proxy.methods.implementation().call({ from: proxyAdminAddress })
            implementation.should.be.equal(this.behavior.address)
          })

          it('emits an event', function () {
            this.events["Upgraded"].returnValues.implementation.should.be.equal(this.behavior.address)
          })

          it('calls the initializer function', async function() {
            const migratable = await InitializableMock.at(this.proxyAddress)
            const x = await migratable.methods.x().call()
            x.should.eq("42")
          })

          it('sends given value to the proxy', async function() {
            const balance = await ZWeb3.getBalance(this.proxyAddress)
            balance.toString().should.eq(value.toString())
          })

          it('uses the storage of the proxy', async function () {
            // storage layout should look as follows:
            //  - 0: Initializable storage
            //  - 1-50: Initailizable reserved storage (50 slots)
            //  - 51: initializerRan
            //  - 52: x
            const storedValue = await Proxy.at(this.proxyAddress).getStorageAt(52);
            parseInt(storedValue).should.eq(42);
          })
        })

        describe('when the sender is not the admin', function () {
          it('reverts', async function () {
            await assertRevert(this.proxy.methods.upgradeToAndCall(this.behavior.address, initializeData).send({ from: anotherAccount }))
          })
        })
      })

      describe('when the call does fail', function () {
        const initializeData = encodeCall('fail')

        it('reverts', async function () {
          await assertRevert(this.proxy.methods.upgradeToAndCall(this.behavior.address, initializeData).send({ from: proxyAdminAddress }))
        })
      })
    })

    describe('with migrations', function () {
      describe('when the sender is the admin', function () {
        const from = proxyAdminAddress
        const value = 1e5

        describe('when upgrading to V1', function () {
          const v1MigrationData = encodeCall('initialize', ['uint256'], [42])

          beforeEach(async function () {
            this.behavior_v1 = await MigratableMockV1.new()
            this.balancePrevious_v1 = new BN(await ZWeb3.getBalance(this.proxyAddress))
            this.events = (await this.proxy.methods.upgradeToAndCall(this.behavior_v1.address, v1MigrationData).send({ from, value })).events
          })

          it('upgrades to the requested version and emits an event', async function () {
            const implementation = await this.proxy.methods.implementation().call({ from: proxyAdminAddress })
            implementation.should.be.equal(this.behavior_v1.address)
            this.events["Upgraded"].returnValues.implementation.should.be.equal(this.behavior_v1.address)
          })

          it('calls the \'initialize\' function and sends given value to the proxy', async function() {
            const migratable = await MigratableMockV1.at(this.proxyAddress)

            const x = await migratable.methods.x().call()
            x.should.eq("42")

            const balance = await ZWeb3.getBalance(this.proxyAddress)
            assert((new BN(balance)).eq(this.balancePrevious_v1.plus(value)))
          })

          describe('when upgrading to V2', function () {
            const v2MigrationData = encodeCall('migrate', ['uint256', 'uint256'], [10, 42])

            beforeEach(async function () {
              this.behavior_v2 = await MigratableMockV2.new()
              this.balancePrevious_v2 = new BN(await ZWeb3.getBalance(this.proxyAddress))
              this.events = (await this.proxy.methods.upgradeToAndCall(this.behavior_v2.address, v2MigrationData).send({ from, value })).events
            })

            it('upgrades to the requested version and emits an event', async function () {
              const implementation = await this.proxy.methods.implementation().call({ from: proxyAdminAddress })
              implementation.should.be.equal(this.behavior_v2.address)
              this.events["Upgraded"].returnValues.implementation.should.be.equal(this.behavior_v2.address)
            })

            it('calls the \'migrate\' function and sends given value to the proxy', async function() {
              const migratable = await MigratableMockV2.at(this.proxyAddress)

              const x = await migratable.methods.x().call()
              x.should.eq("10")

              const y = await migratable.methods.y().call()
              y.should.eq("42")

              const balance = new BN(await ZWeb3.getBalance(this.proxyAddress))
              expect(balance).to.eql(this.balancePrevious_v2.plus(value))
            })

            describe('when upgrading to V3', function () {
              const v3MigrationData = encodeCall('migrate')

              beforeEach(async function () {
                this.behavior_v3 = await MigratableMockV3.new()
                this.balancePrevious_v3 = new BN(await ZWeb3.getBalance(this.proxyAddress))
                this.events = (await this.proxy.methods.upgradeToAndCall(this.behavior_v3.address, v3MigrationData).send({ from, value })).events
              })

              it('upgrades to the requested version and emits an event', async function () {
                const implementation = await this.proxy.methods.implementation().call({ from: proxyAdminAddress })
                implementation.should.be.equal(this.behavior_v3.address)
                this.events["Upgraded"].returnValues.implementation.should.be.equal(this.behavior_v3.address)
              })

              it('calls the \'migrate\' function and sends given value to the proxy', async function() {
                const migratable = await MigratableMockV3.at(this.proxyAddress)

                const x = await migratable.methods.x().call()
                x.should.eq("42")

                const y = await migratable.methods.y().call()
                y.should.eq("10")

                const balance = new BN(await ZWeb3.getBalance(this.proxyAddress))
                expect(balance).to.eql(this.balancePrevious_v3.plus(value))
              })
            })
          })
        })
      })

      describe('when the sender is not the admin', function () {
        const from = anotherAccount

        it('reverts', async function () {
          const behavior_v1 = await MigratableMockV1.new()
          const v1MigrationData = encodeCall('initialize', ['uint256'], [42])
          await assertRevert(this.proxy.methods.upgradeToAndCall(behavior_v1.address, v1MigrationData).send({ from }))
        })
      })
    })
  })

  describe('changeAdmin', function () {
    describe('when the new proposed admin is not the zero address', function () {
      const newAdmin = anotherAccount

      describe('when the sender is the admin', function () {
        beforeEach('transferring', async function () {
          const { events } = await this.proxy.methods.changeAdmin(newAdmin).send({ from: proxyAdminAddress })
          this.events = events
        })

        it('assigns new proxy admin', async function () {
          const newProxyAdmin = await this.proxy.methods.admin().call({ from: newAdmin })
          newProxyAdmin.should.be.equalIgnoreCase(anotherAccount)
        })

        it('emits an event', function () {
          this.events.should.have.key('AdminChanged')
          this.events["AdminChanged"].returnValues.previousAdmin.should.be.equalIgnoreCase(proxyAdminAddress)
          this.events["AdminChanged"].returnValues.newAdmin.should.be.equalIgnoreCase(newAdmin)
        })
      })

      describe('when the sender is not the admin', function () {
        it('reverts', async function () {
          await assertRevert(this.proxy.methods.changeAdmin(newAdmin).send({ from: anotherAccount }))
        })
      })
    })

    describe('when the new proposed admin is the zero address', function () {
      it('reverts', async function () {
        await assertRevert(this.proxy.methods.changeAdmin(ZERO_ADDRESS).send({ from: proxyAdminAddress }))
      })
    })
  })

  describe('storage', function () {
    it('should store the implementation address in specified location', async function () {
      const implementation = await Proxy.at(this.proxyAddress).implementation()
      implementation.should.be.equalIgnoreCase(this.implementation_v0);
    })

    it('should store the admin proxy in specified location', async function () {
      const proxyAdmin = await Proxy.at(this.proxyAddress).admin()
      proxyAdmin.should.be.equal(proxyAdminAddress);
    })
  })

  describe('transparent proxy', function () {
    beforeEach('creating proxy', async function () {
      const initializeData = Buffer.from('')
      this.impl = await ClashingImplementation.new();
      this.proxy = await createProxy(this.impl.address, proxyAdminAddress, initializeData, { from: proxyAdminOwner });

      this.clashing = await ClashingImplementation.at(this.proxy.address);
    });

    it('proxy admin cannot call delegated functions', async function () {
      await assertRevert(this.clashing.methods.delegatedFunction().send({ from: proxyAdminAddress }));
    });

    context('when function names clash', function () {
      it('when sender is proxy admin should run the proxy function', async function () {
        const value = await this.proxy.methods.admin().call({ from: proxyAdminAddress });
        value.should.be.equalIgnoreCase(proxyAdminAddress);
      });

      it('when sender is other should delegate to implementation', async function () {
        const value = await this.proxy.methods.admin().call({ from: anotherAccount });
        value.should.be.equal('0x0000000000000000000000000000000011111142')
      });
    });
  });

  describe('regression', () => {
    const initializeData = Buffer.from('')

    it('should add new function', async () => {
      const instance1 = await Implementation1.new();
      const proxy = await createProxy(instance1.address, proxyAdminAddress, initializeData, { from: proxyAdminOwner });

      const proxyInstance1 = await Implementation1.at(proxy.address);
      await proxyInstance1.methods.setValue(42).send();

      const instance2 = await Implementation2.new();
      await proxy.methods.upgradeTo(instance2.address).send({ from: proxyAdminAddress });

      const proxyInstance2 = await Implementation2.at(proxy.address);
      const res = await proxyInstance2.methods.getValue().call();
      res.toString().should.eq("42");
    });

    it('should remove function', async () => {
      const instance2 = await Implementation2.new();
      const proxy = await createProxy(instance2.address, proxyAdminAddress, initializeData, { from: proxyAdminOwner });

      const proxyInstance2 = await Implementation2.at(proxy.address);
      await proxyInstance2.methods.setValue(42).send();
      const res = await proxyInstance2.methods.getValue().call();
      res.toString().should.eq("42");

      const instance1 = await Implementation1.new();
      await proxy.methods.upgradeTo(instance1.address).send({ from: proxyAdminAddress });

      const proxyInstance1 = await Implementation2.at(proxy.address);
      await assertRevert(proxyInstance1.methods.getValue().call());
    });

    it('should change function signature', async () => {
      const instance1 = await Implementation1.new();
      const proxy = await createProxy(instance1.address, proxyAdminAddress, initializeData, { from: proxyAdminOwner });

      const proxyInstance1 = await Implementation1.at(proxy.address);
      await proxyInstance1.methods.setValue(42).send();

      const instance3 = await Implementation3.new();
      await proxy.methods.upgradeTo(instance3.address).send({ from: proxyAdminAddress });
      const proxyInstance3 = Implementation3.at(proxy.address);

      const res = await proxyInstance3.methods.getValue(8).call();
      res.toString().should.eq("50");
    });

    it('should add fallback function', async () => {
      const initializeData = Buffer.from('')
      const instance1 = await Implementation1.new();
      const proxy = await createProxy(instance1.address, proxyAdminAddress, initializeData, { from: proxyAdminOwner });

      const instance4 = await Implementation4.new();
      await proxy.methods.upgradeTo(instance4.address).send({ from: proxyAdminAddress });
      const proxyInstance4 = await Implementation4.at(proxy.address);

      await sendTransaction(proxy, '', [], [], { from: anotherAccount });

      const res = await proxyInstance4.methods.getValue().call();
      res.toString().should.eq("1");
    });

    it('should remove fallback function', async () => {
      const instance4 = await Implementation4.new();
      const proxy = await createProxy(instance4.address, proxyAdminAddress, initializeData, { from: proxyAdminOwner });

      const instance2 = await Implementation2.new();
      await proxy.methods.upgradeTo(instance2.address).send({ from: proxyAdminAddress });

      await assertRevert(sendTransaction(proxy, '', [], [], { from: anotherAccount }));

      const proxyInstance2 = await Implementation2.at(proxy.address);
      const res = await proxyInstance2.methods.getValue().call();
      res.toString().should.eq("0");
    });
  });
};
