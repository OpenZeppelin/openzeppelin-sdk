const { assertRevert } = require('./helpers/assertRevert');
const expectEvent = require('./helpers/expectEvent');

const BigNumber = web3.BigNumber;

const ZepTokenMock = artifacts.require('ZepTokenMock');
const Vouching = artifacts.require('Vouching');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Vouching', function ([_, owner, transferee, dependencyAddress]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);
  const minStake = new BigNumber(10);

  it('requires a non-null token', async function () {
    await assertRevert(
      Vouching.new(minStake, ZERO_ADDRESS, { from: owner })
    );
  });

  context('with token', async function () {
    const dependencyName = 'dep';

    beforeEach(async function () {
      this.token = await ZepTokenMock.new(owner, MAX_UINT256);

      this.vouching = await Vouching.new(minStake, this.token.address);

      await this.token.approve(
        this.vouching.address, MAX_UINT256, { from: owner }
      );
    });

    it('stores the token address', async function () {
      (await this.vouching.token()).should.equal(this.token.address);
    });

    it('stores the minimum stake', async function () {
      (await this.vouching.minimumStake()).should.be.bignumber.equal(minStake);
    });

    describe('dependency creation', function () {
      it('reverts when initial stake is less than the minimum', async function () {
        await assertRevert(
          this.vouching.create(dependencyName, owner, dependencyAddress, minStake - 1, { from: owner })
        );
      });

      it('reverts for null dependency address', async function () {
        await assertRevert(
          this.vouching.create(dependencyName, owner, ZERO_ADDRESS, minStake, { from: owner })
        );
      });

      it('reverts for null owner address', async function () {
        await assertRevert(
          this.vouching.create(dependencyName, ZERO_ADDRESS, dependencyAddress, minStake, { from: owner })
        );
      });

      it('transfers the initial stake tokens to the vouching contract', async function () {
        const initialBalance = await this.token.balanceOf(this.vouching.address);

        await this.vouching.create(
          dependencyName, owner, dependencyAddress, minStake, { from: owner }
        );

        (await this.token.balanceOf(this.vouching.address)).should.be.bignumber.equal(initialBalance.plus(minStake));
      });

      it('emits a DependencyCreated event', async function () {
        const result = await this.vouching.create(
          dependencyName, owner, dependencyAddress, minStake, { from: owner }
        );

        expectEvent.inLogs(result.logs, 'DependencyCreated');
      });
    });

    context('with a dependency created', function () {
      beforeEach(async function () {
        await this.vouching.create(
          dependencyName, owner, dependencyAddress, minStake, { from: owner }
        );
      });

      it('stores the created dependency', async function () {
        (await this.vouching.getDependencyAddress(dependencyName)).should.equal(dependencyAddress);
        (await this.vouching.getDependencyOwner(dependencyName)).should.equal(owner);
        (await this.vouching.getDependencyStake(dependencyName)).should.be.bignumber.equal(minStake);
      });

      describe('ownership transfer', function () {
        it('reverts when caller is not the dependency\'s owner', async function () {
          await assertRevert(
            this.vouching.transferOwnership(dependencyName, transferee, { from: transferee })
          );
        });

        it('transfers the dependency\'s ownership to a given address', async function () {
          (await this.vouching.getDependencyOwner(dependencyName)).should.equal(owner);

          const result = await this.vouching.transferOwnership(
            dependencyName, transferee, { from: owner }
          );

          (await this.vouching.getDependencyOwner(dependencyName)).should.equal(transferee);

          expectEvent.inLogs(result.logs, 'OwnershipTransferred');
        });
      });

      describe('dependency removal', function () {
        it('reverts when caller is not the dependency\'s owner', async function () {
          await assertRevert(
            this.vouching.remove(dependencyName, { from: transferee })
          );
        });

        it('emits a DependencyRemoved event', async function () {
          const result = await this.vouching.remove(dependencyName, { from: owner });

          expectEvent.inLogs(result.logs, 'DependencyRemoved');
        });
      });
    });
  });
});

