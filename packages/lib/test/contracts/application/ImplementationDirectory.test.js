'use strict';

require('../../setup');

import Contracts from '../../../src/artifacts/Contracts';
import { ZERO_ADDRESS } from '../../../src/utils/Addresses';
import assertRevert from '../../../src/test/helpers/assertRevert';
import shouldBehaveLikeOwnable from '../../../src/test/behaviors/Ownable';
import utils from 'web3-utils';

const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
const ImplementationDirectory = Contracts.getFromLocal(
  'ImplementationDirectory',
);

contract('ImplementationDirectory', function(accounts) {
  accounts = accounts.map(utils.toChecksumAddress); // Required by Web3 v1.x.

  const [_, owner, anotherAddress] = accounts;

  beforeEach(async function() {
    // eslint-disable-next-line @typescript-eslint/camelcase
    this.implementation_v0 = (await DummyImplementation.new()).address;
    // eslint-disable-next-line @typescript-eslint/camelcase
    this.implementation_v1 = (await DummyImplementation.new()).address;
    this.directory = await ImplementationDirectory.new({ from: owner });
  });

  describe('ownership', function() {
    beforeEach(function() {
      this.ownable = this.directory;
    });
    shouldBehaveLikeOwnable(owner, anotherAddress);
  });

  describe('setImplementation', function() {
    const contractName = 'ERC721';

    describe('when the sender is the directory owner', function() {
      const from = owner;

      describe('when registering a contract', function() {
        beforeEach('registering the contract', async function() {
          const { events } = await this.directory.methods
            .setImplementation(contractName, this.implementation_v0)
            .send({ from });
          this.events = events;
        });

        it('can be retrieved afterwards', async function() {
          const registeredImplementation = await this.directory.methods
            .getImplementation(contractName)
            .call();
          assert.equal(registeredImplementation, this.implementation_v0);
        });

        it('emits an event', async function() {
          const event = this.events['ImplementationChanged'];
          expect(event).to.be.an('object');
          assert.equal(event.returnValues.contractName, contractName);
          assert.equal(
            event.returnValues.implementation,
            this.implementation_v0,
          );
        });

        it('allows to register another implementation of the same contract', async function() {
          await this.directory.methods
            .setImplementation(contractName, this.implementation_v1)
            .send({ from });

          const registeredImplementation = await this.directory.methods
            .getImplementation(contractName)
            .call();
          assert.equal(registeredImplementation, this.implementation_v1);
        });

        it('allows to register another contract', async function() {
          const anotherContract = 'anotherContract';
          await this.directory.methods
            .setImplementation(anotherContract, this.implementation_v1)
            .send({ from });

          const registeredImplementation = await this.directory.methods
            .getImplementation(anotherContract)
            .call();
          assert.equal(registeredImplementation, this.implementation_v1);
        });
      });

      describe('when registering an address that is not a contract', function() {
        it('reverts', async function() {
          await assertRevert(
            this.directory.methods
              .setImplementation(contractName, anotherAddress)
              .send({ from }),
          );
        });
      });
    });

    describe('when the sender is not the directory owner', function() {
      const from = anotherAddress;

      it('cannot register contract', async function() {
        await assertRevert(
          this.directory.methods
            .setImplementation(contractName, this.implementation_v0)
            .send({ from }),
        );
      });
    });
  });

  describe('unsetImplementation', function() {
    const contractName = 'ERC721';

    beforeEach('registering the contract', async function() {
      await this.directory.methods
        .setImplementation(contractName, this.implementation_v0)
        .send({ from: owner });
    });

    describe('when the sender is the directory owner', function() {
      const from = owner;

      beforeEach('unregistering the contract', async function() {
        const { events } = await this.directory.methods
          .unsetImplementation(contractName)
          .send({ from });
        this.events = events;
      });

      it('cannot be retrieved afterwards', async function() {
        const registeredImplementation = await this.directory.methods
          .getImplementation(contractName)
          .call();
        assert.equal(registeredImplementation, ZERO_ADDRESS);
      });

      it('emits an event', async function() {
        const event = this.events['ImplementationChanged'];
        expect(event).to.be.an('object');
        assert.equal(event.returnValues.contractName, contractName);
        assert.equal(event.returnValues.implementation, ZERO_ADDRESS);
      });
    });

    describe('when the sender is not the directory owner', function() {
      const from = anotherAddress;

      it('cannot unregister contract', async function() {
        await assertRevert(
          this.directory.methods
            .unsetImplementation(contractName)
            .send({ from }),
        );
      });
    });
  });

  describe('freeze', function() {
    it('starts unfrozen', async function() {
      const frozen = await this.directory.methods.frozen().call();
      frozen.should.be.false;
    });

    describe('when the sender is the owner', function() {
      const from = owner;

      describe('when it is not frozen', function() {
        it('can be frozen', async function() {
          await this.directory.methods.freeze().send({ from });
          const frozen = await this.directory.methods.frozen().call();
          frozen.should.be.true;
        });
      });

      describe('when it is frozen', function() {
        beforeEach(async function() {
          await this.directory.methods.freeze().send({ from });
        });

        it('cannot be re-frozen', async function() {
          await assertRevert(this.directory.methods.freeze().send({ from }));
        });
      });
    });

    describe('when the sender is not the owner', function() {
      const from = anotherAddress;

      it('reverts', async function() {
        await assertRevert(this.directory.methods.freeze().send({ from }));
      });
    });
  });

  describe('set/unset implementation', function() {
    describe('when it is frozen', function() {
      beforeEach(async function() {
        await this.directory.methods.freeze().send({ from: owner });
      });

      it('does not allow to set implementation', async function() {
        await assertRevert(
          this.directory.methods
            .setImplementation('ERC721', this.implementation_v1)
            .send({ from: owner }),
        );
      });

      it('does not allow to unset implementation', async function() {
        await assertRevert(
          this.directory.methods
            .unsetImplementation('ERC721')
            .send({ from: owner }),
        );
      });
    });
  });
});
