'use strict'
require('../../setup')

import utils from 'web3-utils';

import Contracts from '../../../src/artifacts/Contracts'

const ContractWithStructInConstructor = Contracts.getFromLocal('WithStructInConstructor');
const ContractWithConstructorImplementation = Contracts.getFromLocal('WithConstructorImplementation');


contract('Contract', function(accounts) {
  const [_, account] = accounts.map(utils.toChecksumAddress)
  const txParams = { from: account };

  describe('methods', function() {
    /*
     * It seems that truffle/web3 cannot parse correctly a struct that
     * is sent as an argument to a constructor, thus there is no way
     * of asserting the struct attributes/values in terms of equality,
     */
    describe('#new', function() {
      describe('arguments parsing', function() {
        context('when sending only a struct', function() {
          it('instantiates the contract', async function() {
            const args = { buz: 10, foo: 'foo', bar: 'bar' };
            const instance = await ContractWithStructInConstructor.new(args);

            (await instance.methods.buz().call()).should.not.be.null;
            (await instance.methods.foo().call()).should.not.be.null;
            (await instance.methods.bar().call()).should.not.be.null;
            (await instance.methods.sender().call()).should.eq(_);
          });
        });

        context('when sending a struct and txParams', function() {
          it('instantiates the contract', async function() {
            const args = { buz: 10, foo: 'foo', bar: 'bar' };
            const instance = await ContractWithStructInConstructor.new(args, txParams);

            (await instance.methods.buz().call()).should.not.be.null;
            (await instance.methods.foo().call()).should.not.be.null;
            (await instance.methods.bar().call()).should.not.be.null;
            (await instance.methods.sender().call()).should.eq(account);
          });
        });
      });
    });

    describe('#at', function () {
      beforeEach('deploying contracts', async function () {
        this.instance1 = await ContractWithConstructorImplementation.new(10, "foo", txParams);
        this.instance2 = await ContractWithConstructorImplementation.new(20, "bar", txParams);
      });

      it('creates a copy of the instance', async function () {
        const instance1 = ContractWithConstructorImplementation.at(this.instance1.address);
        const instance2 = ContractWithConstructorImplementation.at(this.instance2.address);
        instance1.address.should.not.eq(instance2.address);
        instance1.options.address.should.not.eq(instance2.options.address);
        (await instance1.methods.text().call()).should.eq('foo');
        (await instance2.methods.text().call()).should.eq('bar');
      });
    });
  });
});

