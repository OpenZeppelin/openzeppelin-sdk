'use strict';
require('../setup')

import Contracts from '../../src/utils/Contracts'
import assertRevert from '../../src/test/helpers/assertRevert';

const InitializableMock = Contracts.getFromLocal('InitializableMock');
const SampleMother = Contracts.getFromLocal('SampleMother');
const SampleGramps = Contracts.getFromLocal('SampleGramps');
const SampleFather = Contracts.getFromLocal('SampleFather');
const SampleChild = Contracts.getFromLocal('SampleChild');

contract('Initializable', function () {
  describe('basic testing without inheritance', function () {
    beforeEach('deploying', async function () {
      this.contract = await InitializableMock.new();
    });

    context('before initialize', function () {
      it('initializer has not run', async function () {
        assert.isFalse(await this.contract.initializerRan());
      });
    });

    context('after initialize', function () {
      beforeEach('initializing', async function () {
        await this.contract.initialize();
      });

      it('initializer has run', async function () {
        assert.isTrue(await this.contract.initializerRan());
      });

      it('initializer does not run again', async function () {
        await assertRevert(this.contract.initialize());
      });
    });

    context('after nested initialize', function () {
      beforeEach('initializing', async function () {
        await this.contract.initializeNested();
      });

      it('initializer has run', async function () {
        assert.isTrue(await this.contract.initializerRan());
      });
    });
  });

  describe('complex testing with inheritance', function () {
    const mother = 12;
    const gramps = 56;
    const father = 34;
    const child  = 78;

    beforeEach('deploying', async function () {
      this.contract = await SampleChild.new();
    });

    beforeEach('initializing', async function () {
      await this.contract.initialize(mother, gramps, father, child);
    });

    it('initializes human', async function () {
      assert.equal(await this.contract.isHuman(), true);
    });

    it('initializes mother', async function () {
      assert.equal(await this.contract.mother(), mother);
    });

    it('initializes gramps', async function () {
      assert.equal(await this.contract.gramps(), gramps);
    });

    it('initializes father', async function () {
      assert.equal(await this.contract.father(), father);
    });

    it('initializes child', async function () {
      assert.equal(await this.contract.child(), child);
    });
  });
});
