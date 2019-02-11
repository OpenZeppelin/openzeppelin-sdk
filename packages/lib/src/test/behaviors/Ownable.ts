import assert from 'assert';
import assertRevert from '../helpers/assertRevert';

export default function shouldBehaveLikeOwnable(owner: string, anotherAccount: string) {

  describe('owner', function() {
    it('sets the creator as the owner of the contract', async function() {
      const contractOwner = await this.ownable.methods.owner().call();
      assert.equal(contractOwner, owner);
    });
  });

  describe('transferOwnership', function() {
    describe('when the proposed owner is not the zero address', function() {
      const newOwner = anotherAccount;

      describe('when the sender is the owner', function() {
        const from = owner;

        it('transfers the ownership', async function() {
          await this.ownable.methods.transferOwnership(newOwner).send({ from });
          const contractOwner: string = await this.ownable.methods.owner().call();
          assert.equal(contractOwner, anotherAccount);
        });

        it('emits an event', async function() {
          const { events } = await this.ownable.methods.transferOwnership(newOwner).send({ from });
          const event = events['OwnershipTransferred'];

          assert.equal(event.returnValues.previousOwner, owner);
          assert.equal(event.returnValues.newOwner, newOwner);
        });
      });

      describe('when the sender is not the owner', function() {
        const from = anotherAccount;
        it('reverts', async function() {
          await assertRevert(this.ownable.methods.transferOwnership(newOwner).send({ from }));
        });
      });
    });

    describe('when the new proposed owner is the zero address', function() {
      const newOwner = '0x0000000000000000000000000000000000000000';
      it('reverts', async function() {
        await assertRevert(this.ownable.methods.transferOwnership(newOwner).send({ from: owner }));
      });
    });
  });
}
