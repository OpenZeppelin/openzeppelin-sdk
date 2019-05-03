'use strict'
require('../setup');

import utils from 'web3-utils';
import { ZWeb3, Contracts } from 'zos-lib';
import CaptureLogs from '../helpers/captureLogs';

import balance from '../../src/scripts/balance';

const ERC20 = Contracts.getFromLocal('ERC20Fake');
const ERC20Detailed = Contracts.getFromLocal('ERC20FakeDetailed');

contract('balance script', function(accounts) {
  const [_, account] = accounts.map(utils.toChecksumAddress);

  beforeEach('set logger captures', function() {
    this.logs = new CaptureLogs();
  });

  afterEach('restore captures', function() {
    this.logs.restore();
  });

  describe('get balance', function() {
    context('when not specifying an account address', function() {
      it('throws an error', async function() {
        await balance({ accountAddress: undefined }).should.be.rejectedWith('An account address must be specified.');
      });
    });

    context('when not specifying an ERC20 token address', function() {
      it('logs balance in ETH', async function() {
        await balance({ accountAddress: account });
        this.logs.infos.should.have.lengthOf(1);
        this.logs.infos[0].should.eq('Balance: 100 ETH');
      });
    });

    context('when specifying an invalid ERC20 token address', function() {
      it('throws an error', async function() {
        await balance({ accountAddress: account, contractAddress: '0x42' }).should.be.rejectedWith(/Could not get balance of/);
      });
    });

    context('when specifying a valid ERC20 token address', function() {
      context('when token does not have a symbol and decimals', function() {
        beforeEach('setup', async function() {
          this.erc20 = await ERC20.new();
          await this.erc20.methods.giveAway(account, 15e10).send();
        });

        it('logs the balance without formatting decimals or showing symbol', async function() {
          await balance({ accountAddress: account, contractAddress: this.erc20.address });
          this.logs.infos.should.have.lengthOf(1);
          this.logs.infos[0].should.eq(`Balance: ${15e10.toString()}`);
        });
      });

      context('when it is an ERC20Detailed', function() {
        beforeEach('setup', async function() {
          this.erc20Detailed = await ERC20Detailed.new('MyToken', 'TKN', 10);
          await this.erc20Detailed.methods.giveAway(account, 15e10).send();
        });

        it('logs the balance formatting the output with decimals and shows symbol', async function() {
          await balance({ accountAddress: account, contractAddress: this.erc20Detailed.address });
          this.logs.infos.should.have.lengthOf(1);
          this.logs.infos[0].should.eq(`Balance: 15 TKN`);
        });
      });
    });
  });
});
