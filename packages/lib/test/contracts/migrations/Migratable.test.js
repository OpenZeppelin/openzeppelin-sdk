'use strict';
require('../../setup')

import Contracts from '../../../src/utils/Contracts'
import encodeCall from '../../../src/helpers/encodeCall'
import decodeLogs from '../../../src/helpers/decodeLogs'
import assertRevert from '../../../src/test/helpers/assertRevert'

const Migratable = Contracts.getFromLocal('Migratable');
const MigratableMock = Contracts.getFromLocal('MigratableMock');
const SampleChildV1 = Contracts.getFromLocal('SampleChildV1');
const SampleChildV2 = Contracts.getFromLocal('SampleChildV2');
const SampleChildV3 = Contracts.getFromLocal('SampleChildV3');
const SampleChildV4 = Contracts.getFromLocal('SampleChildV4');
const SampleChildV5 = Contracts.getFromLocal('SampleChildV5');
const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
const AdminUpgradeabilityProxy = Contracts.getFromLocal('AdminUpgradeabilityProxy');

contract('Migratable', function ([_, owner, registrar]) {
  const from = owner;
  let v0, v1, v2, v3, v4, v5;

  before(async function () {
    v0 = await DummyImplementation.new({ from: registrar });
    v1 = await SampleChildV1.new({ from: registrar });
    v2 = await SampleChildV2.new({ from: registrar });
    v3 = await SampleChildV3.new({ from: registrar });
    v4 = await SampleChildV4.new({ from: registrar });
    v5 = await SampleChildV5.new({ from: registrar });
  });

  beforeEach(async function () {
    this.proxy = await AdminUpgradeabilityProxy.new(v0.address, { from });
    this.contract = SampleChildV1.at(this.proxy.address);
  });

  const getMigrationLogs = (rawTx) => {
    return decodeLogs(rawTx.receipt.logs.slice(1), Migratable)
        .filter(log => log.event === 'Migrated');
  };

  const assertMigrationEvent = (logs, contractName, migrationId) => {
    logs.map(log => log.args).should.deep.include({ contractName, migrationId })
  };

  const upgradeToAndCall = (target, implementation, method, args, values, opts) => {
    const data = encodeCall(method, args, values);
    return target.upgradeToAndCall(implementation.address, data, opts || {});
  };

  const sendTransaction = (target, method, args, values, opts) => {
    const data = encodeCall(method, args, values);
    return target.sendTransaction(Object.assign({ data }, opts));
  };

  
  // Initializing to V1
  // ------------------

  const motherV1 = 110, grampsV1 = 120, fatherV1 = 130, childV1 = 140;
  const initialize = (proxy) => upgradeToAndCall(proxy, v1, 'initialize', ['uint256', 'uint256', 'uint256', 'uint256'], [motherV1, grampsV1, fatherV1, childV1], { from });

  describe('initializing a contract', async function () {
    
    beforeEach(async function () {
      (this.tx = await initialize(this.proxy));
    })

    it('should run child initializer', async function () {
      (await this.contract.child()).should.be.bignumber.eq(childV1);
    });

    it('cannot run an initializer twice', async function () {
      await assertRevert(initialize(this.proxy))
    });

    it('should run ancestor initializers', async function () {
      (await this.contract.mother()).should.be.bignumber.eq(motherV1);
      (await this.contract.gramps()).should.be.bignumber.eq(grampsV1);
      (await this.contract.father()).should.be.bignumber.eq(fatherV1);
    });

    it('should fire logs for all migrations', async function () {
      const logs = getMigrationLogs(this.tx);
      logs.should.have.lengthOf(4);
      assertMigrationEvent(logs, 'Child', 'migration_1');
      assertMigrationEvent(logs, 'Mother', 'migration_1');
      assertMigrationEvent(logs, 'Father',  'migration_1');
      assertMigrationEvent(logs, 'Gramps', 'migration_1');
    });

    it('should track migration for child contract', async function () {
      (await this.contract.isMigrated('Child', 'migration_1')).should.be.true;
    });

    it('should track migration for ancestor contracts', async function () {
      (await this.contract.isMigrated('Father', 'migration_1')).should.be.true;
      (await this.contract.isMigrated('Mother', 'migration_1')).should.be.true;
      (await this.contract.isMigrated('Gramps', 'migration_1')).should.be.true;
    });

    it('should not allow initialization to be re-run', async function () {
      await assertRevert(sendTransaction(this.proxy, 'initialize', ['uint256', 'uint256', 'uint256', 'uint256'], [1,2,3,4], { from }));
    });

    it('should not allow initialization of ancestor to be re-run', async function () {
      await assertRevert(sendTransaction(this.proxy, 'initialize', ['uint256', 'uint256'], [1,2], { from }));
    });
  });


  // Migrating to V2
  // ---------------

  const childV2 = 240;
  const migrateToV2 = (proxy) => upgradeToAndCall(proxy, v2, 'migrate', ['uint256'], [childV2], { from });

  describe('migrating to v2', async function () {
    describe('once initialized', async function () {
      beforeEach(async function () {
        await initialize(this.proxy);
        this.tx = await migrateToV2(this.proxy);
        this.contract = SampleChildV2.at(this.proxy.address);
      })

      it('should update child value', async function () {
        (await this.contract.child()).should.be.bignumber.eq(childV2);
      });

      it('should fire logs for all migrations', async function () {
        const logs = getMigrationLogs(this.tx);
        logs.should.have.lengthOf(1);
        assertMigrationEvent(logs, 'Child', 'migration_2');
      });
  
      it('should track migration for child contract', async function () {
        (await this.contract.isMigrated('Child', 'migration_2')).should.be.true;
      });

      it('should not allow to re-run migration', async function () {
        await assertRevert(sendTransaction(this.proxy, 'migrate', ['uint256'], [1], { from }));
      });
    });

    it('should fail if uninitialized', async function () {
      await assertRevert(migrateToV2(this.proxy));
    });
  });


  // Migrating to V3
  // ---------------

  const motherV2 = 210, childV3 = 340;
  const migrateToV3 = (proxy) => upgradeToAndCall(proxy, v3, 'migrate', ['uint256', 'uint256'], [motherV2, childV3], { from });

  describe('migrating to v3', async function () {
    describe('from v2', async function () {
      beforeEach(async function () {
        await initialize(this.proxy);
        await migrateToV2(this.proxy);
        this.tx = await migrateToV3(this.proxy);
        this.contract = SampleChildV3.at(this.proxy.address);
      })

      it('should update all values', async function () {
        (await this.contract.mother()).should.be.bignumber.eq(motherV2);
        (await this.contract.child()).should.be.bignumber.eq(childV3);
      });

      it('should fire logs for all migrations', async function () {
        const logs = getMigrationLogs(this.tx);
        logs.should.have.lengthOf(2);
        assertMigrationEvent(logs, 'Child', 'migration_3');
        assertMigrationEvent(logs, 'Mother', 'migration_2');
      });
  
      it('should track migration for all contracts', async function () {
        (await this.contract.isMigrated('Child', 'migration_3')).should.be.true;
        (await this.contract.isMigrated('Mother', 'migration_2')).should.be.true;
      });

      it('should not allow to re-run migration', async function () {
        await assertRevert(sendTransaction(this.proxy, 'migrate', ['uint256', 'uint256'], [1,2], { from }));
      });
    });

    it('should fail if not migrated to v2', async function () {
      await initialize(this.proxy);
      await assertRevert(migrateToV3(this.proxy));
    });
  });

  
  // Migrating to V4
  // ---------------

  const grampsV2 = 220, fatherV2 = 230, childV4 = 440;
  const migrateToV4 = (proxy) => upgradeToAndCall(proxy, v4, 'migrate', ['uint256', 'uint256', 'uint256'], [grampsV2, fatherV2, childV4], { from });

  describe('migrating to v4', async function () {
    describe('from v3', async function () {
      beforeEach(async function () {
        await initialize(this.proxy);
        await migrateToV2(this.proxy);
        await migrateToV3(this.proxy);
        this.tx = await migrateToV4(this.proxy);
        this.contract = SampleChildV4.at(this.proxy.address);
      })

      it('should update all values', async function () {
        (await this.contract.gramps()).should.be.bignumber.eq(grampsV2);
        (await this.contract.father()).should.be.bignumber.eq(fatherV2);
        (await this.contract.child()).should.be.bignumber.eq(childV4);
      });

      it('should fire logs for all migrations', async function () {
        const logs = getMigrationLogs(this.tx);
        logs.should.have.lengthOf(3);
        assertMigrationEvent(logs, 'Child', 'migration_4');
        assertMigrationEvent(logs, 'Gramps', 'migration_2');
        assertMigrationEvent(logs, 'Father', 'migration_2');
      });
  
      it('should track migration for all contracts', async function () {
        (await this.contract.isMigrated('Child', 'migration_3')).should.be.true;
        (await this.contract.isMigrated('Gramps', 'migration_2')).should.be.true;
        (await this.contract.isMigrated('Father', 'migration_2')).should.be.true;
      });

      it('should not allow to re-run migration', async function () {
        await assertRevert(sendTransaction(this.proxy, 'migrate', ['uint256', 'uint256', 'uint256'], [1,2,3], { from }));
      });
    });

    it('should fail if not migrated to v3', async function () {
      await initialize(this.proxy);
      await migrateToV2(this.proxy)
      await assertRevert(migrateToV4(this.proxy));
    });
  });


  // Migrating to V5
  // ---------------

  const childV5 = 540;
  const migrateToV5 = (proxy) => upgradeToAndCall(proxy, v5, 'migrate', ['uint256'], [childV5], { from });
  const migrateToV5FromV3 = (proxy) => upgradeToAndCall(proxy, v5, 'migrateFromV3', ['uint256','uint256','uint256'], [grampsV2, fatherV2, childV5], { from });
  const migrateToV5FromScratch = (proxy) => upgradeToAndCall(proxy, v5, 'initialize', ['uint256','uint256','uint256','uint256'], [motherV2, grampsV2, fatherV2, childV5], { from });

  describe('migrating to v5', async function () {
    describe('from v4', async function () {
      beforeEach(async function () {
        await initialize(this.proxy);
        await migrateToV2(this.proxy);
        await migrateToV3(this.proxy);
        await migrateToV4(this.proxy);
        this.tx = await migrateToV5(this.proxy);
        this.contract = SampleChildV5.at(this.proxy.address);
      })

      it('should update child value', async function () {
        (await this.contract.child()).should.be.bignumber.eq(childV5);
      });

      it('should fire logs for all migrations', async function () {
        const logs = getMigrationLogs(this.tx);
        logs.should.have.lengthOf(1);
        assertMigrationEvent(logs, 'Child', 'migration_5');
      });
  
      it('should track migration for all contracts', async function () {
        (await this.contract.isMigrated('Child', 'migration_5')).should.be.true;
      });

      it('should not allow to re-run migration', async function () {
        await assertRevert(sendTransaction(this.proxy, 'migrate', ['uint256'], [1], { from }));
      });
    });

    describe('from v3', async function () {
      beforeEach(async function () {
        await initialize(this.proxy);
        await migrateToV2(this.proxy);
        await migrateToV3(this.proxy);
        this.tx = await migrateToV5FromV3(this.proxy);
        this.contract = SampleChildV5.at(this.proxy.address);
      })

      it('should update all values', async function () {
        (await this.contract.child()).should.be.bignumber.eq(childV5);
        (await this.contract.gramps()).should.be.bignumber.eq(grampsV2);
        (await this.contract.father()).should.be.bignumber.eq(fatherV2);
      });

      it('should fire logs for all migrations', async function () {
        const logs = getMigrationLogs(this.tx);
        logs.should.have.lengthOf(4);
        assertMigrationEvent(logs, 'Child', 'migration_4');
        assertMigrationEvent(logs, 'Child', 'migration_5');
        assertMigrationEvent(logs, 'Gramps', 'migration_2');
        assertMigrationEvent(logs, 'Father', 'migration_2');
      });
  
      it('should track migration for all contracts', async function () {
        (await this.contract.isMigrated('Child', 'migration_5')).should.be.true;
        (await this.contract.isMigrated('Gramps', 'migration_2')).should.be.true;
        (await this.contract.isMigrated('Father', 'migration_2')).should.be.true;
      });

      it('should not allow to re-run migration', async function () {
        await assertRevert(sendTransaction(this.proxy, 'migrate', ['uint256'], [1], { from }));
      });
    });

    describe('from scratch', async function () {
      beforeEach(async function () {
        this.tx = await migrateToV5FromScratch(this.proxy);
        this.contract = SampleChildV5.at(this.proxy.address);
      })

      it('should set all values', async function () {
        (await this.contract.child()).should.be.bignumber.eq(childV5);
        (await this.contract.gramps()).should.be.bignumber.eq(grampsV2);
        (await this.contract.father()).should.be.bignumber.eq(fatherV2);
        (await this.contract.mother()).should.be.bignumber.eq(motherV2);
      });

      it('should fire logs for all migrations', async function () {
        const logs = getMigrationLogs(this.tx);
        logs.should.have.lengthOf(7);
        assertMigrationEvent(logs, 'Child', 'migration_5');
        assertMigrationEvent(logs, 'Gramps', 'migration_1');
        assertMigrationEvent(logs, 'Gramps', 'migration_2');
        assertMigrationEvent(logs, 'Father', 'migration_1');
        assertMigrationEvent(logs, 'Father', 'migration_2');
        assertMigrationEvent(logs, 'Mother', 'migration_1');
        assertMigrationEvent(logs, 'Mother', 'migration_2');
      });
  
      it('should track migration for all contracts', async function () {
        (await this.contract.isMigrated('Child', 'migration_5')).should.be.true;
        (await this.contract.isMigrated('Gramps', 'migration_2')).should.be.true;
        (await this.contract.isMigrated('Father', 'migration_2')).should.be.true;
      });
    });
  });

  describe('an initialized migratable', function () {
    beforeEach('creating initialized migratable', async function () {
      this.migratable = await MigratableMock.new();
      sendTransaction(this.migratable, 'initialize', ['uint256'], [0]);
    });

    it('should not allow rerunning the initializer', async function () {
      await assertRevert(
        sendTransaction(this.migratable, 'initialize', ['uint256'], [0])
      );
    });

    it('should not allow running another initializer', async function () {
      await assertRevert(
        sendTransaction(this.migratable, 'secondInitialize')
      );
    });
  });
});
