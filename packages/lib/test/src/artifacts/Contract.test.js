'use strict'
require('../../setup')

import utils from 'web3-utils';
import sinon from 'sinon';

import Contracts from '../../../src/artifacts/Contracts'
import Contract from '../../../src/artifacts/ZosContract';

const ContractWithStructInConstructor = Contracts.getFromLocal('WithStructInConstructor');

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
  });
});

