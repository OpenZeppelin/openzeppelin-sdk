'use strict'
require('../../setup')

import { deploy, sendTransaction, sendDataTransaction } from '../../../src/utils/Transactions';
import Contracts from '../../../src/utils/Contracts';
import { assertRevert, encodeCall } from '../../../src';

const DEFAULT_GAS = 6721975;

contract('Transactions', function([_account1, account2]) {

  beforeEach('load contract', function () {
    this.DummyImplementation = Contracts.getFromLocal('DummyImplementation');
  });

  const assertGasLt = (txHash, expected) => {
    const { gas } = web3.eth.getTransaction(txHash);
    gas.should.be.at.most(parseInt(expected));
  };

  const assertGas = (txHash, expected) => {
    const { gas } = web3.eth.getTransaction(txHash);
    gas.should.be.eq(parseInt(expected));
  };

  const assertFrom = (txHash, expected) => {
    const { from } = web3.eth.getTransaction(txHash);
    from.should.be.eq(expected);
  }

  describe('via truffle', function () {
    it('uses default gas for new contract', async function () {
      const instance = await this.DummyImplementation.new();
      assertGas(instance.transactionHash, DEFAULT_GAS);
    });

    it('uses default gas for sending transaction', async function () {
      const instance = await this.DummyImplementation.new();
      const { tx } = await instance.initialize(42, 'foo', [1,2,3]);
      assertGas(tx, DEFAULT_GAS);
    });
  });

  describe('sendTransaction', function () {
    beforeEach('deploys contract', async function () {
      this.instance = await deploy(this.DummyImplementation);
    });

    it('correctly sends the transaction', async function () {
      await sendTransaction(this.instance.initialize, [42, 'foo', [1,2,3]]);
      const actualValue = await this.instance.value();
      actualValue.toNumber().should.eq(42);
    });

    it('estimates gas', async function () {
      const { tx } = await sendTransaction(this.instance.initialize, [42, 'foo', [1,2,3]]);
      assertGasLt(tx, 1000000);
    });

    it('uses specified gas', async function () {
      const { tx } = await sendTransaction(this.instance.initialize, [42, 'foo', [1,2,3]], { gas: 800000});
      assertGas(tx, 800000);
    });

    it('honours other tx params', async function () {
      const { tx } = await sendTransaction(this.instance.initialize, [42, 'foo', [1,2,3]], { from: account2 });
      assertGasLt(tx, 1000000);
      assertFrom(tx, account2);
    });

    it('handles failing transactions', async function () {
      await assertRevert(sendTransaction(this.instance.reverts));
    });
  });

  describe('sendDataTransaction', function () {
    beforeEach('deploys contract', async function () {
      this.instance = await deploy(this.DummyImplementation);
      this.encodedCall = encodeCall('initialize', ['uint256', 'string', 'uint256[]'], [42, 'foo', [1,2,3]]);
    });

    it('correctly sends the transaction', async function () {      
      await sendDataTransaction(this.instance, { data: this.encodedCall });
      const actualValue = await this.instance.value();
      actualValue.toNumber().should.eq(42);
    });

    it('estimates gas', async function () {
      const { tx } = await sendDataTransaction(this.instance, { data: this.encodedCall });
      assertGasLt(tx, 1000000);
    });

    it('uses specified gas', async function () {
      const { tx } = await sendDataTransaction(this.instance, { data: this.encodedCall, gas: 800000 });
      assertGas(tx, 800000);
    });

    it('honours other tx params', async function () {
      const { tx } = await sendDataTransaction(this.instance, { data: this.encodedCall, from: account2 });
      assertGasLt(tx, 1000000);
      assertFrom(tx, account2);
    });

    it('handles failing transactions', async function () {
      await assertRevert(sendDataTransaction(this.instance, { data: encodeCall('reverts') }));
    });
  });

  describe('deploy', function () {
    describe('without a constructor', function () {
      it('correctly deploys an instance', async function () {
        const instance = await deploy(this.DummyImplementation);
        (await instance.version()).should.eq("V1");
      });
  
      it('estimates gas', async function () {
        const instance = await deploy(this.DummyImplementation);
        assertGasLt(instance.transactionHash, 1000000);
      });
  
      it('uses specified gas', async function () {
        const instance = await deploy(this.DummyImplementation, [], { gas: 800000 });
        assertGas(instance.transactionHash, 800000);
      });
  
      it('honours other tx params', async function () {
        const instance = await deploy(this.DummyImplementation, [], { from: account2 });
        assertGasLt(instance.transactionHash, 1000000);
        assertFrom(instance.transactionHash, account2);
      });
    });

    describe('with a constructor', function () {
      beforeEach('load contract', function () {
        this.WithConstructorImplementation = Contracts.getFromLocal('WithConstructorImplementation');
      });

      it('correctly deploys an instance', async function () {
        const instance = await deploy(this.WithConstructorImplementation, [42, "foo"]);
        (await instance.value()).toNumber().should.eq(42);
        (await instance.text()).should.eq("foo");
      });

      it('estimates gas', async function () {
        const instance = await deploy(this.WithConstructorImplementation, [42, "foo"]);
        assertGasLt(instance.transactionHash, 1000000);
      });

      it('uses specified gas', async function () {
        const instance = await deploy(this.WithConstructorImplementation, [42, "foo"], { gas: 800000 });
        assertGas(instance.transactionHash, 800000);
      });
  
      it('honours other tx params', async function () {
        const instance = await deploy(this.WithConstructorImplementation, [42, "foo"], { from: account2 });
        assertGasLt(instance.transactionHash, 1000000);
        assertFrom(instance.transactionHash, account2);
      });

      it('handles failing constructors', async function () {
        await assertRevert(deploy(this.WithConstructorImplementation, [0, "foo"]));
      });
    });
  });
})
