require('../../setup');

import { accounts, defaultSender, provider, web3 } from '@openzeppelin/test-environment';
import { balance } from '@openzeppelin/test-helpers';

import sinon from 'sinon';
import ZWeb3 from '../../../src/artifacts/ZWeb3';
import Contracts from '../../../src/artifacts/Contracts';
import { ZERO_ADDRESS } from '../../../src/utils/Addresses';
import BN from 'bignumber.js';

import { expect } from 'chai';

describe('ZWeb3', function() {
  const [account, account1, account2] = accounts;

  before('deploy dummy instance', async function() {
    this.DummyImplementation = Contracts.getFromLocal('DummyImplementation');
    this.impl = await this.DummyImplementation.new();
  });

  const shouldBehaveLikeWeb3Instance = (account, receiverAccount) => {
    it('initializes web3 with a provider', async function() {
      ZWeb3.web3.currentProvider.should.not.be.null;
    });

    it('knows a web3 instance', function() {
      ZWeb3.web3.should.not.be.null;
      ZWeb3.eth.should.not.be.null;
      ZWeb3.version.should.not.be.null;
    });

    it('tells the default existing account', async function() {
      const defaultAccount = await ZWeb3.defaultAccount();
      defaultAccount.should.be.eq(defaultSender);
    });

    it('tells the name of the current network ID', async function() {
      const network = await ZWeb3.getNetwork();
      network.should.be.eq(await web3.eth.net.getId());
    });

    it('tells the name of the current network', async function() {
      const networkName = await ZWeb3.getNetworkName();
      networkName.should.be.eq(`dev-${await web3.eth.net.getId()}`);
    });

    describe('checkNetworkId', function() {
      context('when providing an invalid network id', function() {
        it('throws an error', async function() {
          await ZWeb3.checkNetworkId('-35').should.be.rejectedWith(/Unexpected network ID: requested -35/);
        });
      });
    });

    it('tells whether the current network is mainnet or not', async function() {
      const isMainnet = await ZWeb3.isMainnet();
      isMainnet.should.be.false;
    });

    it('tells the latest block', async function() {
      const block = await ZWeb3.getLatestBlock();

      block.should.be.an('object');
      block.number.should.not.be.null;
    });

    describe('transactions', function() {
      beforeEach('sending transaction', async function() {
        const value = new BN(1e18).toString(10);
        this.receiverBalanceTracker = await balance.tracker(receiverAccount);
        const receipt = await ZWeb3.eth.sendTransaction({ from: accounts[0], to: receiverAccount, value });
        this.txHash = receipt.transactionHash;
      });

      describe('get transaction receipt with timeout', function() {
        beforeEach('get receipt', async function() {
          this.timeout = 3000;
          this.receipt = await ZWeb3.eth.getTransactionReceipt(this.txHash);
        });

        afterEach(() => sinon.restore());

        describe('when the transaction receipt takes less than the specified timeout', function() {
          beforeEach('stub ZWeb3', function() {
            sinon.stub(ZWeb3.eth, 'getTransactionReceipt').resolves(this.receipt);
          });

          it('returns the transaction receipt', async function() {
            const receipt = await ZWeb3.getTransactionReceiptWithTimeout(this.txHash, this.timeout);
            receipt.should.be.deep.equal(this.receipt);
          });
        });

        describe('when the transaction receipt fails continuously', function() {
          beforeEach('stub ZWeb3', function() {
            sinon.stub(ZWeb3.eth, 'getTransactionReceipt').throws('Error', 'unknown transaction');
          });

          it('fails', async function() {
            try {
              await ZWeb3.getTransactionReceiptWithTimeout(this.txHash, this.timeout);
              assert.fail('expecting get transaction receipt to timeout');
            } catch (error) {
              error.message.should.be.eq(
                `Transaction ${this.txHash} wasn't processed in ${this.timeout / 1000} seconds`,
              );
            }
          }).timeout(5000);
        });
      });
    });

    describe('checksum address', function() {
      context('when address has uppercase hexa letters', function() {
        context('when address is not well checksummed', function() {
          it('fails', function() {
            const address = '0x82154A1cbcAb0461D4C12ee9Cb890244eead6d9F';
            () =>
              ZWeb3.toChecksumAddress(address).should.throw(
                'Error',
                /is not a valid Ethereum address or it has not been checksummed correctly/,
              );
          });
        });

        context('when address has been checksummed properly', function() {
          it('returns checksummed address', function() {
            ZWeb3.toChecksumAddress(accounts[0]).should.be.eq(accounts[0]);
          });
        });
      });

      context('when valid but not checksummed address is given', function() {
        it('returns checksummed address', function() {
          const address = accounts[0].toLowerCase();
          ZWeb3.toChecksumAddress(address).should.be.eq(accounts[0]);
        });
      });
    });
  };

  describe('initializing ZWeb3', function() {
    context('when initializing without a provider', function() {
      it('initializes web3 without a provider', async function() {
        ZWeb3.initialize();
        ZWeb3.web3.should.not.be.null;

        expect(ZWeb3.web3.currentProvider).to.be.null;
      });
    });

    context('when initializing ZWeb3 with an http url', function() {
      beforeEach('initialize web3', async function() {
        const hostURL = provider.wrappedProvider.host;
        expect(hostURL).to.have.string('http://');

        ZWeb3.initialize(provider.wrappedProvider.host);
      });

      shouldBehaveLikeWeb3Instance(account, account2);
    });

    context('when initializing ZWeb3 with a web3 provider', function() {
      beforeEach('initialize web3', function() {
        ZWeb3.initialize(provider);
      });

      shouldBehaveLikeWeb3Instance(account, account1);
    });
  });
});
