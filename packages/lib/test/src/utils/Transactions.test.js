'use strict'
require('../../setup')

import times from 'lodash.times';
import sinon from 'sinon';
import axios from 'axios';
import { setInterval } from 'timers';
import utils from 'web3-utils';

import ZWeb3 from '../../../src/artifacts/ZWeb3'
import Contracts from '../../../src/artifacts/Contracts';
import advanceBlock from '../../../src/helpers/advanceBlock';
import { assertRevert, encodeCall, sleep } from '../../../src';
import Transactions, { state } from '../../../src/utils/Transactions';

const DEFAULT_GAS = 6721975;
const DEFAULT_PARAMS = [42, 'foo', [1, 2, 3]];

contract('Transactions', function(accounts) {
  accounts = accounts.map(utils.toChecksumAddress);
  const [_account1, account2] = accounts;

  beforeEach('load contract', function () {
    this.DummyImplementation = Contracts.getFromLocal('DummyImplementation');
  });

  const assertGasLt = async (txHash, expected) => {
    const { gas } = await ZWeb3.getTransaction(txHash);
    gas.should.be.at.most(parseInt(expected));
  };

  const assertGas = async (txHash, expected) => {
    const { gas } = await ZWeb3.getTransaction(txHash);
    gas.should.be.eq(parseInt(expected));
  };

  const assertGasPrice = async (txHash, expected) => {
    const { gasPrice } = await ZWeb3.getTransaction(txHash);
    parseInt(gasPrice, 10).should.be.eq(expected);
  };

  const assertFrom = async (txHash, expected) => {
    const { from } = await ZWeb3.getTransaction(txHash);
    from.should.be.eq(expected);
  }

  describe('via contract wrapper', function () {
    it('uses default gas for new contract', async function () {
      const instance = await this.DummyImplementation.new();
      await assertGas(instance.deployment.transactionHash, DEFAULT_GAS);
    });

    it('uses default gas for sending transaction', async function () {
      const instance = await this.DummyImplementation.new();
      const receipt = await instance.methods.initialize(42, 'foo', [1,2,3]).send();
      await assertGas(receipt.transactionHash, DEFAULT_GAS);
    });
  });

  describe('sendTransaction', function () {
    beforeEach('deploys contract', async function () {
      this.instance = await Transactions.deployContract(this.DummyImplementation);
    });

    it('correctly sends the transaction', async function () {
      await Transactions.sendTransaction(this.instance.methods.initialize, DEFAULT_PARAMS);
      const actualValue = await this.instance.methods.value().call();
      actualValue.should.eq('42');
    });

    it('honours other tx params', async function () {
      const receipt = await Transactions.sendTransaction(this.instance.methods.initialize, DEFAULT_PARAMS, { from: account2 });
      await assertFrom(receipt.transactionHash, account2);
    });

    it('handles failing transactions', async function () {
      await assertRevert(Transactions.sendTransaction(this.instance.methods.reverts));
    });

    describe('gas', function () {
      afterEach('restore stubs', function () {
        sinon.restore();
      })

      describe('when there is a default gas amount defined', function () {
        describe('when a gas amount is given', function () {
          it('uses specified gas', async function () {
            const receipt = await Transactions.sendTransaction(this.instance.methods.initialize, DEFAULT_PARAMS, { gas: 800000 });
            await assertGas(receipt.transactionHash, 800000);
          });
        });

        describe('when no gas amount is given', function () {
          it('uses the default gas amount', async function () {
            const receipt = await Transactions.sendTransaction(this.instance.methods.initialize, DEFAULT_PARAMS);
            await assertGas(receipt.transactionHash, DEFAULT_GAS);
          });
        });
      });

      describe('when there is no default gas defined', function () {
        beforeEach('stub default gas amount', function () {
          sinon.stub(Contracts, 'getArtifactsDefaults').resolves({ from: _account1, gas: undefined, gasPrice: 100000000000 })
        });

        describe('when a gas amount is given', function () {
          it('uses the specified gas amount', async function () {
            const receipt = await Transactions.sendTransaction(this.instance.methods.initialize, DEFAULT_PARAMS, { gas: 800000 });
            await assertGas(receipt.transactionHash, 800000);
          });
        });

        describe('when no gas amount is given', function () {
          it('estimates gas', async function () {
            const receipt = await Transactions.sendTransaction(this.instance.methods.initialize, DEFAULT_PARAMS);
            await assertGasLt(receipt.transactionHash, 1000000);
          });

          // TODO: (STUB estimateGas problem) the tests below are disabled because
          // stub is not working with Web3 v1's estimateGas via methods.
          // In Web3 v1, calling a method function with parameters returns a transaction object,
          // and it is this object which has an estimateGas function. Transactions' sendTransaction
          // will create its own transaction object, which cannot be intercepted here as it
          // was done in Web3 v0.

          it.skip('retries estimating gas', async function () {
            const stub = sinon.stub(this.instance.methods.initialize, 'estimateGas')
            _.times(3, i => stub.onCall(i).throws('Error', 'gas required exceeds allowance or always failing transaction'))
            stub.returns(800000)

            const receipt = await Transactions.sendTransaction(this.instance.methods.initialize, DEFAULT_PARAMS);
            await assertGas(receipt.transactionHash, 800000 * 1.25 + 15000);
          });

          it('retries estimating gas up to 3 times', async function () {
            const stub = sinon.stub(Transactions, '_calculateActualGas');
            _.times(4, i => stub.onCall(i).throws('Error', 'gas required exceeds allowance or always failing transaction'))

            await Transactions.sendTransaction(this.instance.methods.initialize, DEFAULT_PARAMS).should.be.rejectedWith(/always failing transaction/);
          });
        });
      });
    });

    describe('gas price', function () {
      beforeEach('simulate mainnet', async function() {
        sinon.stub(ZWeb3, 'isMainnet').resolves(true)
      });

      afterEach('return to testnet and undo stub', async function() {
        delete state.gasPrice;
        sinon.restore();
      });

      describe('uses an API to determine gas price', async function() {
        beforeEach('stub API reply', async function() {
          sinon.stub(axios, 'get').resolves({ data: { average: 49 } })
        });

        it('uses gas price API when gas not specified', async function () {
          const receipt = await Transactions.sendTransaction(this.instance.methods.initialize, DEFAULT_PARAMS);
          await await assertGasPrice(receipt.transactionHash, 49 * 1e8);
        });

        it('does not use gas price API when gasPrice specified', async function () {
          const receipt = await Transactions.sendTransaction(this.instance.methods.initialize, DEFAULT_PARAMS, { gasPrice: 1234 });
          await await assertGasPrice(receipt.transactionHash, 1234);
        });
      });

      describe('does not blindly trust API', async function() {
        beforeEach('stub API reply', async function() {
          sinon.stub(axios, 'get').resolves({ data: { average: 1234123412341234 } })
        });

        it('produces an error when gas price API gives giant value', async function () {
          await Transactions.sendTransaction(this.instance.methods.initialize, DEFAULT_PARAMS).should.be.rejectedWith(/is over 100 gwei/);
        });
      });
    });
  });

  describe('sendDataTransaction', function () {
    beforeEach('deploys contract', async function () {
      this.instance = await Transactions.deployContract(this.DummyImplementation);
      this.encodedCall = encodeCall('initialize', ['uint256', 'string', 'uint256[]'], DEFAULT_PARAMS);
    });

    it('correctly sends the transaction', async function () {
      await Transactions.sendDataTransaction(this.instance, { data: this.encodedCall });
      const actualValue = await this.instance.methods.value().call();
      actualValue.should.eq('42');
    });

    it('honours other tx params', async function () {
      const receipt = await Transactions.sendDataTransaction(this.instance, { data: this.encodedCall, from: account2 });
      await assertFrom(receipt.transactionHash, account2);
    });

    it('handles failing transactions', async function () {
      await assertRevert(Transactions.sendDataTransaction(this.instance, { data: encodeCall('reverts') }));
    });

    describe('gas', function () {
      afterEach('restore stubs', function () {
        sinon.restore();
      })

      describe('when there is a default gas amount defined', function () {
        describe('when a gas amount is given', function () {
          it('uses specified gas', async function () {
            const receipt = await Transactions.sendDataTransaction(this.instance, { data: this.encodedCall, gas: 800000 });
            await assertGas(receipt.transactionHash, 800000);
          });
        });

        describe('when no gas amount is given', function () {
          it('uses the default gas amount', async function () {
            const receipt = await Transactions.sendTransaction(this.instance.methods.initialize, DEFAULT_PARAMS);
            await assertGas(receipt.transactionHash, DEFAULT_GAS);
          });
        });
      });

      describe('when there is no default gas defined', function () {
        beforeEach('stub default gas amount', function () {
          sinon.stub(Contracts, 'getArtifactsDefaults').resolves({ from: _account1, gas: undefined, gasPrice: 100000000000 })
        });

        describe('when a gas amount is given', function () {
          it('uses specified gas', async function () {
            const receipt = await Transactions.sendDataTransaction(this.instance, { data: this.encodedCall, gas: 800000 });
            await assertGas(receipt.transactionHash, 800000);
          });
        });

        describe('when no gas amount is given', function () {
          it('estimates gas', async function () {
            const receipt = await Transactions.sendDataTransaction(this.instance, { data: this.encodedCall });
            await assertGasLt(receipt.transactionHash, 1000000);
          });

          it('retries estimating gas', async function () {
            const stub = sinon.stub(ZWeb3, 'estimateGas')
            _.times(3, i => stub.onCall(i).throws('Error', 'gas required exceeds allowance or always failing transaction'));
            stub.returns(800000)

            const receipt = await Transactions.sendDataTransaction(this.instance, { data: this.encodedCall });
            await assertGas(receipt.transactionHash, 800000 * 1.25 + 15000);
          });

          it('retries estimating gas up to 3 times', async function () {
            const stub = sinon.stub(ZWeb3, 'estimateGas')
            _.times(4, i => stub.onCall(i).throws('Error', 'gas required exceeds allowance or always failing transaction'));
            stub.returns(800000)

            await Transactions.sendDataTransaction(this.instance, { data: this.encodedCall }).should.be.rejectedWith(/always failing transaction/);
          });
        });
      });
    });

    describe('gas price', function () {
      describe('uses an API to determine gas price', async function() {
        beforeEach('Stub API reply and simulate mainnet', async function() {
          sinon.stub(ZWeb3, 'isMainnet').resolves(true)
          sinon.stub(axios, 'get').resolves({ data: { average: 49 } })
        });

        afterEach('return to testnet and undo stub', async function() {
          delete state.gasPrice;
          sinon.restore();
        });

        it('uses gas price API when gas not specified', async function () {
          const receipt = await Transactions.sendDataTransaction(this.instance, { data: this.encodedCall });
          await await assertGasPrice(receipt.transactionHash, 49 * 1e8);
        });

        it('does not use gas price API when gasPrice specified', async function () {
          const receipt = await Transactions.sendDataTransaction(this.instance, { gasPrice: 1234, data: this.encodedCall });
          await await assertGasPrice(receipt.transactionHash, 1234);
        });
      });

      describe('does not blindly trust API', async function() {
        beforeEach('stub API reply and simulate mainnet', async function() {
          sinon.stub(ZWeb3, 'isMainnet').resolves(true)
          sinon.stub(axios, 'get').resolves({ data: { average: 1234123412341234 } })
        });

        afterEach('Return to testnet and undo stub', async function() {
          delete state.gasPrice;
          sinon.restore();
        });

        it('produces an error when gas price API gives giant value', async function () {
          await Transactions.sendDataTransaction(this.instance, { data: this.encodedCall }).should.be.rejectedWith(/is over 100 gwei/);
        });
      });
    });
  });

  describe('sendRawTransaction', function () {
    beforeEach('deploys contract', async function () {
      this.instance = await Transactions.deployContract(this.DummyImplementation);
      this.encodedCall = encodeCall('initialize', ['uint256', 'string', 'uint256[]'], DEFAULT_PARAMS);
    });

    it('correctly sends the transaction', async function () {
      const transactionParams = { data: this.encodedCall };
      await Transactions.sendRawTransaction(this.instance.address, transactionParams);
      const actualValue = await this.instance.methods.value().call();
      actualValue.should.eq('42');
    });

    it('honours other tx params', async function () {
      const transactionParams = { data: this.encodedCall };
      const receipt = await Transactions.sendRawTransaction(this.instance.address, transactionParams, { from: account2 });
      await assertFrom(receipt.transactionHash, account2);
    });

    it('handles failing transactions', async function () {
      const transactionParams = { data: encodeCall('reverts') };
      await assertRevert(Transactions.sendRawTransaction(this.instance.address, transactionParams));
    });

    context('when calling a function and also sending funds', function() {
      context('when function is payable', function() {
        it('sends funds', async function () {
          const encodedCall = encodeCall('initializePayable', [], []);
          const transactionParams = { data: encodedCall, value: ZWeb3.toWei('1', 'ether') };
          await Transactions.sendRawTransaction(this.instance.address, transactionParams, { from: account2 });
          (await ZWeb3.getBalance(this.instance.address)).should.eq(1e18.toString());
        });
      });

      context('when function is not payable', function() {
        it('reverts', async function () {
          const transactionParams = { data: this.encodedCall, value: ZWeb3.toWei('1', 'ether') };
          await assertRevert(Transactions.sendRawTransaction(this.instance.address, transactionParams, { from: account2 }));
          (await ZWeb3.getBalance(this.instance.address)).should.eq('0');
        });
      });
    });

    describe('gas', function () {
      afterEach('restore stubs', function () {
        sinon.restore();
      })

      describe('when there is a default gas amount defined', function () {
        describe('when a gas amount is given', function () {
          it('uses specified gas', async function () {
            const transactionParams = { data: this.encodedCall };
            const receipt = await Transactions.sendRawTransaction(this.instance.address, transactionParams, { gas: 800000 });
            await assertGas(receipt.transactionHash, 800000);
          });
        });

        describe('when no gas amount is given', function () {
          it('uses the default gas amount', async function () {
            const transactionParams = { data: this.encodedCall };
            const receipt = await Transactions.sendRawTransaction(this.instance.address, transactionParams);
            await assertGas(receipt.transactionHash, DEFAULT_GAS);
          });
        });
      });

      describe('when there is no default gas defined', function () {
        beforeEach('stub default gas amount', function () {
          sinon.stub(Contracts, 'getArtifactsDefaults').resolves({ from: _account1, gas: undefined, gasPrice: 100000000000 })
        });

        describe('when a gas amount is given', function () {
          it('uses specified gas', async function () {
            const transactionParams = { data: this.encodedCall };
            const receipt = await Transactions.sendRawTransaction(this.instance.address, transactionParams, { gas: 800000 });
            await assertGas(receipt.transactionHash, 800000);
          });
        });

        describe('when no gas amount is given', function () {
          it('estimates gas', async function () {
            const transactionParams = { data: this.encodedCall };
            const receipt = await Transactions.sendRawTransaction(this.instance.address, transactionParams);
            await assertGasLt(receipt.transactionHash, 1000000);
          });

          it('retries estimating gas', async function () {
            const stub = sinon.stub(ZWeb3, 'estimateGas')
            _.times(3, i => stub.onCall(i).throws('Error', 'gas required exceeds allowance or always failing transaction'));
            stub.returns(800000)

            const transactionParams = { data: this.encodedCall };
            const receipt = await Transactions.sendRawTransaction(this.instance.address, transactionParams);
            await assertGas(receipt.transactionHash, 800000 * 1.25 + 15000);
          });

          it('retries estimating gas up to 3 times', async function () {
            const stub = sinon.stub(ZWeb3, 'estimateGas')
            _.times(4, i => stub.onCall(i).throws('Error', 'gas required exceeds allowance or always failing transaction'));
            stub.returns(800000)

            const transactionParams = { data: this.encodedCall };
            await Transactions.sendRawTransaction(this.instance.address, transactionParams).should.be.rejectedWith(/always failing transaction/);
          });
        });
      });
    });

    describe('gas price', function () {
      describe('uses an API to determine gas price', async function() {
        beforeEach('Stub API reply and simulate mainnet', async function() {
          sinon.stub(ZWeb3, 'isMainnet').resolves(true)
          sinon.stub(axios, 'get').resolves({ data: { average: 49 } })
        });

        afterEach('return to testnet and undo stub', async function() {
          delete state.gasPrice;
          sinon.restore();
        });

        it('uses gas price API when gas not specified', async function () {
          const transactionParams = { data: this.encodedCall };
          const receipt = await Transactions.sendRawTransaction(this.instance.address, transactionParams);

          await await assertGasPrice(receipt.transactionHash, 49 * 1e8);
        });

        it('does not use gas price API when gasPrice specified', async function () {
          const transactionParams = { data: this.encodedCall };
          const receipt = await Transactions.sendRawTransaction(this.instance.address, transactionParams, { gasPrice: 1234 });

          await await assertGasPrice(receipt.transactionHash, 1234);
        });
      });

      describe('does not blindly trust API', async function() {
        beforeEach('stub API reply and simulate mainnet', async function() {
          sinon.stub(ZWeb3, 'isMainnet').resolves(true)
          sinon.stub(axios, 'get').resolves({ data: { average: 1234123412341234 } })
        });

        afterEach('Return to testnet and undo stub', async function() {
          delete state.gasPrice;
          sinon.restore();
        });

        it('produces an error when gas price API gives giant value', async function () {
          const transactionParams = { data: this.encodedCall };
          await Transactions.sendRawTransaction(this.instance.address, transactionParams).should.be.rejectedWith(/is over 100 gwei/);
        });
      });
    });
  });

  describe('deploy', function () {
    describe('without a constructor', function () {
      it('correctly deploys an instance', async function () {
        const instance = await Transactions.deployContract(this.DummyImplementation);
        (await instance.methods.version().call()).should.eq("V1");
      });

      it('honours other tx params', async function () {
        const instance = await Transactions.deployContract(this.DummyImplementation, [], { from: account2 });
        await assertFrom(instance.deployment.transactionHash, account2);
      });

      it('shows friendly error if there are unlinked libraries', async function () {
        const WithLibraryMock = Contracts.getFromLocal('WithLibraryMock');
        await Transactions.deployContract(WithLibraryMock).should.be.rejectedWith(/unlinked libraries/i);
      });

      describe('gas', function () {
        afterEach('restore stubs', function () {
          sinon.restore();
        });

        describe('when there is a default gas amount defined', function () {
          describe('when a gas amount is given', function () {
            it('uses specified gas', async function () {
              const instance = await Transactions.deployContract(this.DummyImplementation, [], { gas: 800000 });
              await assertGas(instance.deployment.transactionHash, 800000);
            });
          });

          describe('when no gas amount is given', function () {
            it('uses the default gas amount', async function () {
              const instance = await Transactions.deployContract(this.DummyImplementation, []);
              await assertGas(instance.deployment.transactionHash, DEFAULT_GAS);
            });
          });
        });

        describe('when there is no default gas defined', function () {
          beforeEach('stub default gas amount', function () {
            sinon.stub(Contracts, 'getArtifactsDefaults').resolves({ from: _account1, gas: undefined, gasPrice: 100000000000 })
          });

          describe('when a gas amount is given', function () {
            it('uses specified gas', async function () {
              const instance = await Transactions.deployContract(this.DummyImplementation, [], { gas: 800000 });
              await assertGas(instance.deployment.transactionHash, 800000);
            });
          });

          describe('when no gas amount is given', function () {
            it('estimates gas', async function () {
              const instance = await Transactions.deployContract(this.DummyImplementation);
              await assertGasLt(instance.deployment.transactionHash, 1000000);
            });
          });
        });
      });

      describe('gas price', function () {
        describe('uses an API to determine gas price', async function() {
          beforeEach('stub API reply and simulate mainnet', async function() {
            sinon.stub(ZWeb3, 'isMainnet').resolves(true)
            sinon.stub(axios, 'get').resolves({ data: { average: 49 } })
          });

          afterEach('Return to testnet and undo stub', async function() {
            delete state.gasPrice;
            sinon.restore();
          });

          it('uses gas price API when gas not specified', async function () {
            const instance = await Transactions.deployContract(this.DummyImplementation);

            await await assertGasPrice(instance.deployment.transactionHash, 49 * 1e8);
          });

          it('does not use gas price API when gasPrice specified', async function () {
            const instance = await Transactions.deployContract(this.DummyImplementation, [], { gasPrice: 1234 });

            await await assertGasPrice(instance.deployment.transactionHash, 1234);
          });
        });

        describe('does not blindly trust API', async function() {
          beforeEach('stub API reply and simulate mainnet', async function() {
            sinon.stub(ZWeb3, 'isMainnet').resolves(true)
            sinon.stub(axios, 'get').resolves({ data: { average: 1234123412341234 } })
          });

          afterEach('Return to testnet and undo stub', async function() {
            delete state.gasPrice;
            sinon.restore();
          });

          it('produces an error when gas price API gives giant value', async function () {
            await Transactions.deployContract(this.DummyImplementation).should.be.rejectedWith(/is over 100 gwei/);
          });
        });
      });
    });

    describe('with a constructor', function () {
      beforeEach('load contract', function () {
        this.WithConstructorImplementation = Contracts.getFromLocal('WithConstructorImplementation');
      });

      it('correctly deploys an instance', async function () {
        const instance = await Transactions.deployContract(this.WithConstructorImplementation, [42, "foo"]);
        (await instance.methods.value().call()).should.eq('42');
        (await instance.methods.text().call()).should.eq("foo");
      });

      it('honours other tx params', async function () {
        const instance = await Transactions.deployContract(this.WithConstructorImplementation, [42, "foo"], { from: account2 });
        await assertFrom(instance.deployment.transactionHash, account2);
      });

      it('handles failing constructors', async function () {
        await assertRevert(Transactions.deployContract(this.WithConstructorImplementation, [0, "foo"]));
      });

      describe('gas', function () {
        afterEach('restore stubs', function () {
          sinon.restore();
        })

        describe('when there is a default gas amount defined', function () {
          describe('when a gas amount is given', function () {
            it('uses specified gas', async function () {
              const instance = await Transactions.deployContract(this.WithConstructorImplementation, [42, "foo"], { gas: 800000 });
              await assertGas(instance.deployment.transactionHash, 800000);
            });
          });

          describe('when no gas amount is given', function () {
            it('uses the default gas amount', async function () {
              const instance = await Transactions.deployContract(this.WithConstructorImplementation, [42, "foo"]);
              await assertGas(instance.deployment.transactionHash, DEFAULT_GAS);
            });
          });
        });

        describe('when there is no default gas defined', function () {
          beforeEach('stub default gas amount', function () {
            sinon.stub(Contracts, 'getArtifactsDefaults').resolves({ from: _account1, gas: undefined, gasPrice: 100000000000 })
          });

          describe('when a gas amount is given', function () {
            it('uses specified gas', async function () {
              const instance = await Transactions.deployContract(this.WithConstructorImplementation, [42, "foo"], { gas: 800000 });
              await assertGas(instance.deployment.transactionHash, 800000);
            });
          });

          describe('when no gas amount is given', function () {
            it('estimates gas', async function () {
              const instance = await Transactions.deployContract(this.WithConstructorImplementation, [42, "foo"]);
              await assertGasLt(instance.deployment.transactionHash, 1000000);
            });

            it('retries estimating gas', async function () {
              const stub = sinon.stub(ZWeb3, 'estimateGas')
              _.times(3, i => stub.onCall(i).throws('Error', 'gas required exceeds allowance or always failing transaction'))
              stub.returns(800000)

              const instance = await Transactions.deployContract(this.WithConstructorImplementation, [42, "foo"]);
              await assertGas(instance.deployment.transactionHash, 800000 * 1.25 + 15000);
            });

            it('retries estimating gas up to 3 times', async function () {
              const stub = sinon.stub(ZWeb3, 'estimateGas')
              _.times(4, i => stub.onCall(i).throws('Error', 'gas required exceeds allowance or always failing transaction'))
              stub.returns(800000)

              await Transactions.deployContract(this.WithConstructorImplementation, [42, "foo"]).should.be.rejectedWith(/always failing transaction/);
            });
          });
        });
      });

      describe('gas price', function () {
        describe('uses an API to determine gas price', async function() {
          beforeEach('stub API reply and simulate mainnet', async function() {
            sinon.stub(ZWeb3, 'isMainnet').resolves(true)
            sinon.stub(axios, 'get').resolves({ data: { average: 49 } })
          });

          afterEach('Return to testnet and undo stub', async function() {
            delete state.gasPrice;
            sinon.restore();
          });

          it('uses gas price API when gas not specified', async function () {
            const instance = await Transactions.deployContract(this.WithConstructorImplementation, [42, 'foo']);

            await await assertGasPrice(instance.deployment.transactionHash, 49 * 1e8);
          });

          it('does not use gas price API when gasPrice specified', async function () {
            const instance = await Transactions.deployContract(this.WithConstructorImplementation, [42, 'foo'], { gasPrice: 1234 });

            await assertGasPrice(instance.deployment.transactionHash, 1234);
          });
        });

        describe('does not blindly trust API', async function() {
          beforeEach('stub API reply and simulate mainnet', async function() {
            sinon.stub(ZWeb3, 'isMainnet').resolves(true)
            sinon.stub(axios, 'get').resolves({ data: { average: 1234123412341234 } })
          });

          afterEach('return to testnet and undo stub', async function() {
            delete state.gasPrice;
            sinon.restore();
          });

          it('produces an error when gas price API gives giant value', async function () {
            await Transactions.deployContract(this.WithConstructorImplementation, [42, 'foo']).should.be.rejectedWith(/is over 100 gwei/);
          });
        });
      });
    });
  });

  describe('awaitConfirmations', function () {
    beforeEach('stub node information and enable mining', function () {
      sinon.stub(ZWeb3, 'isGanacheNode').resolves(false)
      this.mineInterval = setInterval(advanceBlock, 100);
    })

    afterEach('undo stub and disable mining', async function () {
      sinon.restore()
      if (this.mineInterval) clearInterval(this.mineInterval);
      await sleep(100);
    })

    it('awaits required confirmations', async function () {
      const initialBlock = await ZWeb3.getLatestBlockNumber();
      const instance = await Transactions.deployContract(this.DummyImplementation, [], { gasPrice: 1e9 });
      await Transactions.awaitConfirmations(instance.deployment.transactionHash, 5);
      (await ZWeb3.hasBytecode(instance.address)).should.be.true;
      const endBlock = await ZWeb3.getLatestBlockNumber();
      (endBlock - 5).should.be.greaterThan(initialBlock);
    });

    it('times out if fails to reach confirmations', async function () {
      const instance = await Transactions.deployContract(this.DummyImplementation, [], { gasPrice: 1e9 });
    });
  });
});
