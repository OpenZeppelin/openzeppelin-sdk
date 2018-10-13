import { Contracts, encodeCall, assertRevert } from 'zos-lib'

const BigNumber = web3.BigNumber;
const ZEPToken = artifacts.require('ZEPToken');
const ZEPValidator = artifacts.require('ZEPValidator');
const BasicJurisdiction = Contracts.getFromNodeModules('tpl-contracts-zos', 'BasicJurisdiction')

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ZEPToken', ([ _, tokenOwner, another, jurisdictionOwner, validatorOwner, zeppelin, sender, recipient ]) => {
  const receiveTokensAttributeID = 999
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

  beforeEach('initialize jurisdiction', async function () {
    this.jurisdiction = await BasicJurisdiction.new()
    const initializeJurisdictionData = encodeCall('initialize', ['address'], [jurisdictionOwner])
    await this.jurisdiction.sendTransaction({ data: initializeJurisdictionData })
  })

  beforeEach('initialize ZEP token', async function () {
    this.zepToken = await ZEPToken.new()
    const initializeData = encodeCall('initialize', ['address', 'address', 'uint256'], [tokenOwner, this.jurisdiction.address, receiveTokensAttributeID])
    await this.zepToken.sendTransaction({ data: initializeData })
  });

  it('has a name', async function () {
    const name = await this.zepToken.name({ from: another });
    name.should.be.equal('ZEP Token');
  });

  it('has a symbol', async function () {
    const symbol = await this.zepToken.symbol({ from: another });
    symbol.should.be.equal('ZEP');
  });

  it('has an amount of decimals', async function () {
    const decimals = await this.zepToken.decimals({ from: another });
    decimals.should.be.bignumber.equal(18);
  });

  it('has the correct total supply', async function () {
    const totalZEP = new BigNumber('100000000e18');
    (await this.zepToken.totalSupply({ from: another })).should.be.bignumber.equal(totalZEP);
  })

  it('can be paused by creator', async function () {
    await this.zepToken.pause({ from: tokenOwner });
  })

  it('cannot be paused by anybody', async function () {
    await assertRevert(this.zepToken.pause({ from: another }));
  })

  describe('TPL', function () {
    const amount = '5e18'

    beforeEach('initialize and approve validator', async function () {
      this.validator = await ZEPValidator.new()
      const initializeValidatorData = encodeCall('initialize', ['address', 'address', 'uint256'], [validatorOwner, this.jurisdiction.address, receiveTokensAttributeID])
      await this.validator.sendTransaction({ data: initializeValidatorData })

      await this.jurisdiction.addValidator(this.validator.address, "ZEP Validator", { from: jurisdictionOwner })
      await this.jurisdiction.addAttributeType(receiveTokensAttributeID, false, false, ZERO_ADDRESS, 0, 0, 0, "can transfer", { from: jurisdictionOwner })
      await this.jurisdiction.addValidatorApproval(this.validator.address, receiveTokensAttributeID, { from: jurisdictionOwner })
      await this.validator.addOrganization(zeppelin, 100, "ZEP Org", { from: validatorOwner })
    })

    describe('when the sender is allowed to receive tokens', function () {
      beforeEach(async function () {
        await this.validator.issueAttribute(sender, { from: zeppelin })
      })

      describe('when the sender has tokens', function () {
        beforeEach(async function () {
          await this.zepToken.transfer(sender, amount, { from: tokenOwner })
        })

        describe('when the recipient is not allowed to receive tokens', function () {
          assertTokensCannotBeTransferred()
        })

        describe('when the recipient is allowed to receive tokens', function () {
          beforeEach(async function () {
            await this.validator.issueAttribute(recipient, { from: zeppelin })
          })

          assertTokensCanBeTransferred()

          describe('when the recipient\'s permission to receive tokens is revoked', function () {
            beforeEach(async function () {
              // TODO: this should be allowed to be done through the validator
              await this.jurisdiction.removeAttributeFrom(recipient, receiveTokensAttributeID, { from: jurisdictionOwner })
            })

            assertTokensCannotBeTransferred()
          })

          describe('when the validator approval is removed', function () {
            beforeEach(async function () {
              await this.jurisdiction.removeValidatorApproval(this.validator.address, receiveTokensAttributeID, { from: jurisdictionOwner })
            })

            assertTokensCannotBeTransferred()
          })
        })

        describe('when the sender\'s permission to receive tokens is revoked', function () {
          describe('when the recipient is not allowed to receive tokens', function () {
            assertTokensCannotBeTransferred()
          })

          describe('when the recipient is allowed to receive tokens', function () {
            beforeEach(async function () {
              await this.validator.issueAttribute(recipient, { from: zeppelin })
            })

            assertTokensCanBeTransferred()

            describe('when the recipient\'s permission to receive tokens is revoked', function () {
              beforeEach(async function () {
                // TODO: this should be allowed to be done through the validator
                await this.jurisdiction.removeAttributeFrom(recipient, receiveTokensAttributeID, { from: jurisdictionOwner })
              })

              assertTokensCannotBeTransferred()
            })

            describe('when the validator approval is removed', function () {
              beforeEach(async function () {
                await this.jurisdiction.removeValidatorApproval(this.validator.address, receiveTokensAttributeID, { from: jurisdictionOwner })
              })

              assertTokensCannotBeTransferred()
            })
          })
        })
      })
    })

    function assertTokensCannotBeTransferred() {
      it('cannot transfer', async function () {
        assert.equal(await this.zepToken.canTransfer(recipient, amount, { from: sender }), false)
        await assertRevert(this.zepToken.transfer(recipient, amount, { from: sender }))
      })

      it('cannot transfer from', async function () {
        await this.zepToken.approve(recipient, amount, { from: sender })

        assert.equal(await this.zepToken.canTransferFrom(sender, recipient, amount, { from: recipient }), false)
        await assertRevert(this.zepToken.transferFrom(sender, recipient, amount, { from: recipient }))
      })
    }

    function assertTokensCanBeTransferred() {
      it('can transfer', async function () {
        assert(await this.zepToken.canTransfer(recipient, amount, { from: sender }))
        await this.zepToken.transfer(recipient, amount, { from: sender })

        assert((await this.zepToken.balanceOf(recipient)).eq(amount))
      })

      it('can transfer from', async function () {
        await this.zepToken.approve(recipient, amount, { from: sender })

        assert(await this.zepToken.canTransferFrom(sender, recipient, amount, { from: recipient }))
        await this.zepToken.transferFrom(sender, recipient, amount, { from: recipient })

        assert((await this.zepToken.balanceOf(recipient)).eq(amount))
      })
    }
  })
});
