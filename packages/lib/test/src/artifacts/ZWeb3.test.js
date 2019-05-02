require('../../setup')

import sinon from 'sinon'
import ZWeb3 from '../../../src/artifacts/ZWeb3'
import Contracts from '../../../src/artifacts/Contracts'
import { ZERO_ADDRESS } from '../../../src/utils/Addresses'
import utils from 'web3-utils';
import BN from 'bignumber.js';

contract('ZWeb3', function(accounts) {
  accounts = accounts.map(utils.toChecksumAddress);
  const [_, account, account1, account2] = accounts;
  
  before('deploy dummy instance', async function () {
    this.DummyImplementation = Contracts.getFromLocal('DummyImplementation')
    this.impl = await this.DummyImplementation.new()
  })

  const shouldBehaveLikeWeb3Instance = (account, receiverAccount) => {
    it('initializes web3 with a provider', function () {
      ZWeb3.web3().currentProvider.should.not.be.null;
    })

    it('knows a web3 instance', function () {
      ZWeb3.web3().should.not.be.null
      ZWeb3.eth().should.not.be.null
      ZWeb3.version().should.not.be.null
    })

    it('calculates sha3', function () {
      ZWeb3.sha3('something').should.be.eq('0x68371d7e884c168ae2022c82bd837d51837718a7f7dfb7aa3f753074a35e1d87')
    })

    it('tells whether an address is valid', function () {
      ZWeb3.isAddress(accounts[0]).should.be.true
      ZWeb3.isAddress(ZERO_ADDRESS).should.be.true

      ZWeb3.isAddress('bla').should.be.false
      ZWeb3.isAddress(null).should.be.false
      ZWeb3.isAddress(undefined).should.be.false
    })

    it('tells the list of existing accounts', async function () {
      const accounts = await ZWeb3.accounts()
      accounts.should.be.deep.equal(accounts)
    })

    it('tells the default existing account', async function () {
      const defaultAccount = await ZWeb3.defaultAccount()
      defaultAccount.should.be.eq(accounts[0])
    })

    it('tells the balanace of a given account', async function () {
      const balance = await ZWeb3.getBalance(account)
      balance.should.be.an('string')
      balance.should.equal(100e18.toString())
    })

    it('tells the name of the current node', async function () {
      const node = await ZWeb3.getNode()
      node.should.match(/EthereumJS TestRPC/)
    })

    it('tells the name of the current network ID', async function () {
      const network = await ZWeb3.getNetwork()
      network.should.be.eq(4447)
    })

    it('tells the name of the current network', async function () {
      const networkName = await ZWeb3.getNetworkName()
      networkName.should.be.eq('dev-4447')
    })

    it('tells whether the current network is mainnet or not', async function () {
      const isMainnet = await ZWeb3.isMainnet()
      isMainnet.should.be.false
    })

    it('tells the latest block', async function () {
      const block = await ZWeb3.getLatestBlock()

      block.should.be.an('object')
      block.number.should.not.be.null
    })

    describe('toWei', function () {
      context('when specifying ether as convertion unit', function () {
        it('transforms ethers to wei', function () {
          ZWeb3.toWei('1', 'ether').should.eq(1e18.toString());
        })
      })

      context('when specifying gwei as convertion unit', function () {
        it('transforms ethers to wei', function () {
          ZWeb3.toWei('1', 'gwei').should.eq(1e9.toString());
        })
      })
    })

    describe('getUnits', function () {
      it('returns array of valid units', function () {
        const units = ZWeb3.getUnits();
        units.should.be.an('array').that.includes('wei', 'gwei', 'ether');
        units.should.be.an('array').that.not.includes('foo', 'bar', 'buz');
      })
    })

    describe('get code', function () {
      it('can tell the deployed bytecode of a certain address', async function () {
        const bytecode = await ZWeb3.getCode(this.impl.address)
        bytecode.should.be.equal(this.DummyImplementation.schema.linkedDeployedBytecode)
      })
    })

    describe('get storage', function () {
      it('tells the value stored at a certain storage slot', async function () {
        await this.impl.methods.initialize(32, 'hello', [1, 2, 3]).send()
        const storage = await ZWeb3.getStorageAt(this.impl.address, 0)
        storage.should.be.equal('0x20')
      })
    })

    describe('estimate gas', function () {
      it('can estimate the gas of a call', async function () {
        const { gasUsed: expectedGas } = this.impl.deployment.transactionReceipt
        const gas = await ZWeb3.estimateGas({ data: this.DummyImplementation.schema.linkedBytecode })
        gas.should.be.equal(expectedGas)
      })
    })

    describe('transactions', function () {
      beforeEach('sending transaction', async function () {
        const value = (new BN(1e18)).toString(10);
        const receipt = await ZWeb3.sendTransaction({ from: accounts[0], to: receiverAccount, value })
        this.txHash = receipt.transactionHash;
      })

      describe('send transaction', function () {
        it('can send a transaction', async function () {
          (await ZWeb3.getBalance(receiverAccount)).should.eq(101e18.toString())
        })
      })

      describe('get transaction', function () {
        it('can estimate the gas of a call', async function () {
          const transaction = await ZWeb3.getTransaction(this.txHash)

          transaction.should.be.an('object')
          transaction.value.should.be.eq(1e18.toString())
          transaction.from.should.be.eq(accounts[0])
          transaction.to.should.be.eq(receiverAccount)
          transaction.nonce.should.not.be.null
          transaction.blockNumber.should.not.be.null
          transaction.blockHash.should.not.be.null
          transaction.gas.should.not.be.null
          transaction.gasPrice.should.not.be.null
          transaction.hash.should.be.eq(this.txHash)
        })
      })

      describe('get transaction receipt', function () {
        it('can estimate the gas of a call', async function () {
          const receipt = await ZWeb3.getTransactionReceipt(this.txHash)

          receipt.should.be.an('object')
          receipt.logs.should.not.be.null
          receipt.blockNumber.should.not.be.null
          receipt.blockHash.should.not.be.null
          receipt.gasUsed.should.not.be.null
          receipt.transactionHash.should.not.be.null
        })
      })

      describe('get transaction receipt with timeout', function () {
        beforeEach('get receipt', async function () {
          this.timeout = 3000
          this.receipt = await ZWeb3.getTransactionReceipt(this.txHash)
        })

        afterEach(() => sinon.restore())

        describe('when the transaction receipt takes less than the specified timeout', function () {
          beforeEach('stub ZWeb3', function () {
            sinon.stub(ZWeb3, 'getTransactionReceipt').resolves(this.receipt)
          })

          it('returns the transaction receipt', async function () {
            const receipt = await ZWeb3.getTransactionReceiptWithTimeout(this.txHash, this.timeout);
            receipt.should.be.deep.equal(this.receipt)
          })
        })

        describe('when the transaction receipt fails continuously', function () {
          beforeEach('stub ZWeb3', function () {
            sinon.stub(ZWeb3, 'getTransactionReceipt').throws('Error', 'unknown transaction')
          })

          it('fails', async function () {
            try {
              await ZWeb3.getTransactionReceiptWithTimeout(this.txHash, this.timeout)
              assert.fail('expecting get transaction receipt to timeout')
            } catch (error) {
              error.message.should.be.eq(`Transaction ${this.txHash} wasn't processed in ${this.timeout / 1000} seconds!`)
            }
          })
        })
      })

      describe('checksum address', function () {
        context('when address has uppercase hexa letters', function () {
          context('when address is not well checksummed', function () {
            it('fails', function () {
              const address = '0x82154A1cbcAb0461D4C12ee9Cb890244eead6d9F';
              (() => ZWeb3.toChecksumAddress(address).should.throw('Error', /is not a valid Ethereum address or it has not been checksummed correctly/));
            });
          });

          context('when address has been checksummed properly', function () {
            it('returns checksummed address', function () {
              ZWeb3.toChecksumAddress(accounts[0]).should.be.eq(accounts[0]);
            });
          });
        });

        context('when valid but not checksummed address is given', function () {
          it('returns checksummed address', function () {
            const address = accounts[0].toLowerCase();
            ZWeb3.toChecksumAddress(address).should.be.eq(accounts[0]);
          });
        });
      });
    })
  };

  describe('initializing ZWeb3', function () {
    context('when initializing without a provider', function () {
      it('initializes web3 without a provider', async function () {
        ZWeb3.initialize();
        ZWeb3.web3().should.not.be.null;

        expect(ZWeb3.web3().currentProvider).to.be.null;
      })
    })

    context('when initializing ZWeb3 with an http url', function () {
      beforeEach('initialize web3', function () {
        ZWeb3.initialize('http://localhost:9555');
      })

      shouldBehaveLikeWeb3Instance(account, account2);
    })

    context('when initializing ZWeb3 with a web3 provider', function () {
      beforeEach('initialize web3', function () {
        ZWeb3.initialize(web3.currentProvider);
      })

      shouldBehaveLikeWeb3Instance(account, account1);
    })

  })
})
