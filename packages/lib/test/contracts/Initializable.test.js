'use strict';
require('../setup');

import Contracts from '../../src/artifacts/Contracts';
import assertRevert from '../../src/test/helpers/assertRevert';

const InitializableMock = Contracts.getFromLocal('InitializableMock');
const SampleMother = Contracts.getFromLocal('SampleMother');
const SampleGramps = Contracts.getFromLocal('SampleGramps');
const SampleFather = Contracts.getFromLocal('SampleFather');
const SampleChild = Contracts.getFromLocal('SampleChild');

contract('Initializable', function() {
  describe('basic testing without inheritance', function() {
    beforeEach('deploying', async function() {
      this.contract = await InitializableMock.new();
    });

    context('before initialize', function() {
      it('initializer has not run', async function() {
        assert.isFalse(await this.contract.methods.initializerRan().call());
      });
    });

    context('after initialize', function() {
      beforeEach('initializing', async function() {
        await this.contract.methods.initialize().send();
      });

      it('initializer has run', async function() {
        assert.isTrue(await this.contract.methods.initializerRan().call());
      });

      it('initializer does not run again', async function() {
        await assertRevert(this.contract.methods.initialize().send());
      });
    });

    context('after nested initialize', function() {
      beforeEach('initializing', async function() {
        await this.contract.methods.initializeNested().send();
      });

      it('initializer has run', async function() {
        assert.isTrue(await this.contract.methods.initializerRan().call());
      });
    });
  });

  describe('complex testing with inheritance', function() {
    const mother = 12;
    const gramps = 56;
    const father = 34;
    const child = 78;

    beforeEach('deploying', async function() {
      this.contract = await SampleChild.new();
    });

    beforeEach('initializing', async function() {
      await this.contract.methods
        .initialize(mother, gramps, father, child)
        .send();
    });

    it('initializes human', async function() {
      assert.equal(await this.contract.methods.isHuman().call(), true);
    });

    it('initializes mother', async function() {
      assert.equal(await this.contract.methods.mother().call(), mother);
    });

    it('initializes gramps', async function() {
      assert.equal(await this.contract.methods.gramps().call(), gramps);
    });

    it('initializes father', async function() {
      assert.equal(await this.contract.methods.father().call(), father);
    });

    it('initializes child', async function() {
      assert.equal(await this.contract.methods.child().call(), child);
    });
  });
});
